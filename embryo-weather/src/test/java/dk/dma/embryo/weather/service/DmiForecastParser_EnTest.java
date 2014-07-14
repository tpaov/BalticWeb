/* Copyright (c) 2011 Danish Maritime Authority
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */
package dk.dma.embryo.weather.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import org.jglue.cdiunit.AdditionalClasses;
import org.jglue.cdiunit.CdiRunner;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.unitils.reflectionassert.ReflectionAssert;

import dk.dma.embryo.common.configuration.LogConfiguration;
import dk.dma.embryo.common.configuration.PropertyFileService;
import dk.dma.embryo.weather.model.DistrictForecast;
import dk.dma.embryo.weather.model.RegionForecast;

/**
 * @author Jesper Tejlgaard
 */
@RunWith(CdiRunner.class)
@AdditionalClasses({PropertyFileService.class, LogConfiguration.class})
public class DmiForecastParser_EnTest {
    
    @Inject
    DmiForecastParser_En parser;
    
    @Test
    public void test() throws IOException {

        List<DistrictForecast> expected = new ArrayList<>();
        expected.add(new DistrictForecast("Daneborg", 
                "North and northeast, 8 to 13 m/s, this night in western up to gale, 15 m/s, Tuesday east and northeast, 8 to 13 m/s, becoming southeast and decreasing to 5 to 10 m/s. Locally fog and transiently rain from east, mainly moderate to poor visibility, Tuesday gradually some improving visibility from southeast.", 
                "Significant wave height: 3 m. Swells: 2,5 m."));
        expected.add(new DistrictForecast(
                "Kangikajik",
                "Gradually north and northwest, increasing up to gale 10 to 18 m/s, Tuesday gradually cyclonic variable, up to gale about 15 m/s, in southernmost part mainly southwest and south, 5 to 10 m/s. Rain and moderate to poor visibility.",
                "Significant wave height: 3,5 m. Swells: 3 m."));
        expected.add(new DistrictForecast("Aputiteeq",
                "North and northeast, 5 to 10 m/s, this evening decreasing and this night variable, below 8 m/s, Tuesday southwest becoming south , 3 to 8 m/s. In northern part locally rain with moderate visibility, otherwise good visibility, apart from fog patches.",
                "Significant wave height: 1,5 m. Swells: 2 m."));

        InputStream is = getClass().getResourceAsStream("/dmi/grudseng-mini.xml");

        RegionForecast forecast = parser.parse(is);

        String expectedOverview = "A low, 1005 hPa, northeast of Iceland, is moving towards westnorthwest to Kangikajik, gradually filling some. A low, 9805 hPa, over Labrador Sea, is moving slowly towards north.";
        
        Assert.assertEquals(expectedOverview, forecast.getDesc());
        Assert.assertEquals("15.00 UTC", forecast.getTime());
        Assert.assertNotNull(forecast.getFrom());
        Assert.assertEquals(1404755100000L, forecast.getFrom().getTime());
        Assert.assertNotNull(forecast.getTo());
        Assert.assertEquals(1404842400000L, forecast.getTo().getTime());
        Assert.assertEquals(3, forecast.getDistricts().size());

        ReflectionAssert.assertReflectionEquals(expected, forecast.getDistricts());
    }

    @Test
    public void testYearChange() throws IOException {

        List<DistrictForecast> expected = new ArrayList<>();
        expected.add(new DistrictForecast("Daneborg", 
                "North and northeast, 8 to 13 m/s, this night in western up to gale, 15 m/s, Tuesday east and northeast, 8 to 13 m/s, becoming southeast and decreasing to 5 to 10 m/s. Locally fog and transiently rain from east, mainly moderate to poor visibility, Tuesday gradually some improving visibility from southeast.", 
                "Significant wave height: 3 m. Swells: 2,5 m."));

        InputStream is = getClass().getResourceAsStream("/dmi/grudseng-yearchange.xml");

        RegionForecast forecast = parser.parse(is);

        Assert.assertNotNull(forecast.getFrom());
        Assert.assertEquals(1388473200000L, forecast.getFrom().getTime());
        Assert.assertNotNull(forecast.getTo());
        Assert.assertEquals(1388556000000L, forecast.getTo().getTime());
        Assert.assertEquals(1, forecast.getDistricts().size());

        ReflectionAssert.assertReflectionEquals(expected, forecast.getDistricts());
    }


    @Test
    public void testFullFile() throws IOException {

        InputStream is = getClass().getResourceAsStream("/dmi/grudseng.xml");

        RegionForecast forecast = parser.parse(is);

        String expectedOverview = "A low, 1005 hPa, northeast of Iceland, is moving towards westnorthwest to Kangikajik, gradually filling some. A low, 9805 hPa, over Labrador Sea, is moving slowly towards north.";
        Assert.assertEquals(expectedOverview, forecast.getDesc());
        Assert.assertEquals("15.00 UTC", forecast.getTime());
        Assert.assertNotNull(forecast.getFrom());
        Assert.assertEquals(1404755100000L, forecast.getFrom().getTime());
        Assert.assertNotNull(forecast.getTo());
        Assert.assertEquals(1404842400000L, forecast.getTo().getTime());
        Assert.assertEquals(14, forecast.getDistricts().size());
    }
}
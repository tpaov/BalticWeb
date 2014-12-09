/* Copyright (c) 2011 Danish Maritime Authority.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package dk.dma.embryo.vessel.json.client;

import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;

public interface AisViewServiceNorwegianData {
    @GET
    @Path("/vessel/list")
    List<Vessel> vesselList();

    /*
    @GET
    @Path("vessel_target_details")
    Map<String, Object> vesselTargetDetails(@QueryParam("mmsi") long vesselId, @QueryParam("past_track") int pastTrack);
     */
    public static class VesselListResult {
        private List<String[]> vessels;

        public String toString() {
            return AisJsonClientFactory.asJson(this);
        }

        public List<String[]> getVessels() {
            return vessels;
        }
        public void setVessels(List<String[]> vessels) {
            this.vessels = vessels;
        }
    }
    /*
    public static class VesselList {
        private List<String[]> vessels;

        public List<String[]> getVessels() {
            return vessels;
        }
        public void setVessels(List<String[]> vessels) {
            this.vessels = vessels;
        }
    }
     */

    public static class Vessel {

        private String country;
        private String sourceRegion;
        private String type;
        private String lastReport;
        private Long mmsi;
        private String sourceCountry;
        private String sourceType;
        private String targetType;
        private String callsign;
        private Double cog;
        private String destination;
        private Double draught;
        private String eta;
        private Double heading;
        private Long imoNo;
        private String lastPosReport;
        private String lastStaticReport;
        private Double lat;
        private Double length;
        private Double lon;
        private Boolean moored;
        private String name;
        private String navStatus;
        private Double rot;
        private Double sog;
        private String vesselCargo;
        private String vesselType;
        private Double width;

        public String getCountry() {
            return country;
        }
        public void setCountry(String country) {
            this.country = country;
        }

        public String getSourceRegion() {
            return sourceRegion;
        }
        public void setSourceRegion(String sourceRegion) {
            this.sourceRegion = sourceRegion;
        }

        public String getType() {
            return type;
        }
        public void setType(String type) {
            this.type = type;
        }

        public String getLastReport() {
            return lastReport;
        }
        public void setLastReport(String lastReport) {
            this.lastReport = lastReport;
        }

        public Long getMmsi() {
            return mmsi;
        }
        public void setMmsi(Long mmsi) {
            this.mmsi = mmsi;
        }

        public String getSourceCountry() {
            return sourceCountry;
        }
        public void setSourceCountry(String sourceCountry) {
            this.sourceCountry = sourceCountry;
        }

        public String getSourceType() {
            return sourceType;
        }
        public void setSourceType(String sourceType) {
            this.sourceType = sourceType;
        }

        public String getTargetType() {
            return targetType;
        }
        public void setTargetType(String targetType) {
            this.targetType = targetType;
        }

        public String getCallsign() {
            return callsign;
        }
        public void setCallsign(String callsign) {
            this.callsign = callsign;
        }

        public Double getCog() {
            return cog;
        }
        public void setCog(Double cog) {
            this.cog = cog;
        }

        public String getDestination() {
            return destination;
        }
        public void setDestination(String destination) {
            this.destination = destination;
        }

        public Double getDraught() {
            return draught;
        }
        public void setDraught(Double draught) {
            this.draught = draught;
        }

        public String getEta() {
            return eta;
        }
        public void setEta(String eta) {
            this.eta = eta;
        }

        public Double getHeading() {
            return heading;
        }
        public void setHeading(Double heading) {
            this.heading = heading;
        }

        public Long getImoNo() {
            return imoNo;
        }
        public void setImoNo(Long imoNo) {
            this.imoNo = imoNo;
        }

        public String getLastPosReport() {
            return lastPosReport;
        }
        public void setLastPosReport(String lastPosReport) {
            this.lastPosReport = lastPosReport;
        }

        public String getLastStaticReport() {
            return lastStaticReport;
        }
        public void setLastStaticReport(String lastStaticReport) {
            this.lastStaticReport = lastStaticReport;
        }

        public Double getLat() {
            return lat;
        }
        public void setLat(Double lat) {
            this.lat = lat;
        }

        public Double getLength() {
            return length;
        }
        public void setLength(Double length) {
            this.length = length;
        }

        public Double getLon() {
            return lon;
        }
        public void setLon(Double lon) {
            this.lon = lon;
        }

        public Boolean getMoored() {
            return moored;
        }
        public void setMoored(Boolean moored) {
            this.moored = moored;
        }

        public String getName() {
            return name;
        }
        public void setName(String name) {
            this.name = name;
        }

        public String getNavStatus() {
            return navStatus;
        }
        public void setNavStatus(String navStatus) {
            this.navStatus = navStatus;
        }

        public Double getRot() {
            return rot;
        }
        public void setRot(Double rot) {
            this.rot = rot;
        }

        public Double getSog() {
            return sog;
        }
        public void setSog(Double sog) {
            this.sog = sog;
        }

        public String getVesselCargo() {
            return vesselCargo;
        }
        public void setVesselCargo(String vesselCargo) {
            this.vesselCargo = vesselCargo;
        }

        public String getVesselType() {
            return vesselType;
        }
        public void setVesselType(String vesselType) {
            this.vesselType = vesselType;
        }

        public Double getWidth() {
            return width;
        }
        public void setWidth(Double width) {
            this.width = width;
        }


        /*
        "type": "vesselTarget",
        "lastReport": "2014-12-04T08:49:35.47",
        "mmsi": 0,
        "sourceCountry": "NO",
        "sourceType": "LIVE",
        "targetType": "A",
        "callsign": "",
        "cog": 31.3,
        "destination": "CH 16",
        "draught": 2,
        "heading": 126,
        "lastPosReport": "2014-12-04T08:49:35.47",
        "lastStaticReport": "2014-12-03T23:34:40.125",
        lat": 60.56769666666666,
        "length": 12,
        "lon": 4.955996666666667,


        "moored": false,
        "name": "",
        "navStatus": "Under way using engine",
        "rot": 0,
        "sog": 0.5,
        "vesselCargo": "Undefined",
        "vesselType": "Unknown",
        "width": 4
    },
         */


}
}
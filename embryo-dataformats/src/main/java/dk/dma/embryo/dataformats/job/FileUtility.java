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
package dk.dma.embryo.dataformats.job;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;

/**
 * @author Jesper Tejlgaard
 */
public class FileUtility {

    String localDirectory;

    public FileUtility(String localDirectory) {
        this.localDirectory = localDirectory;
    }
    
    public String[] listFiles(FilenameFilter fileNameFilter){
        return new File(localDirectory).list(fileNameFilter);
    }

    public boolean deleteFile(String name) throws IOException, InterruptedException {
        String localName = localDirectory + "/" + name;
        boolean deleted = true;

        File file = new File(localName);
        if (file.exists()) {
            file.delete();
            Thread.sleep(10);
            if (file.exists()) {
                deleted = false;
            }
        }

        return deleted;
    }
}
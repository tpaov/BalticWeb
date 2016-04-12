
/*
maritimeweb.groupOverlays.getLayers().push(new ol.layer.Tile({
    title: 'FLERE Lande',
    source: new ol.source.TileWMS({
        url: 'http://demo.opengeo.org/geoserver/wms',
        params: {'LAYERS': 'ne:ne_10m_admin_1_states_provinces_lines_shp'},
        serverType: 'geoserver'
    })
}));

maritimeweb.map.getView().on('propertychange', function(e) {
    switch (e.key) {
        case 'resolution':
            console.log(e.oldValue);
            break;
    }
});

*/


console.log("maritimeweb - map" + maritimeweb.map);
console.log("maritimeweb - BBOX metode " + maritimeweb.clientBBOX());
console.log("maritimeweb - center = " + maritimeweb.center);



angular.module("maritimeweb", [])
    .controller("VesselsController", function($scope, $http) {


        $scope.vesselsOnMap = [];
        var vesselVectorLayer = {};
        // first run
        var firstRun = true;

        var refreshVessels = function(evt) {

            if (!firstRun) { // for anything but the first run, check if the layer is visible.
                if (!maritimeweb.isLayerVisible('vesselVectorLayer')) {
                    console.log("dont Update layer not visible BREAK");
                    return null;
                }
            }

            $scope.clientBBox = maritimeweb.clientBBOX();
            $scope.zoomLvl = maritimeweb.map.getView().getZoom();


            $http.get( "/rest/vessel/listarea?area="+ maritimeweb.clientBBOX(), {
                timeout : 6000
            }).success(function (vessels) {
                $scope.vesselsonmap = [];
                console.log(vessels.length + " vessels loaded  " + evt );
                $scope.vessels = vessels;
                $scope.vesselsStatus = "OK";
                $scope.lastFetchTimestamp = new Date();

                maritimeweb.groupVessels.getLayers().remove(vesselVectorLayer);

                for(var i = 0; i< vessels.length; i++){
                    var vesselData = {  name: vessels[i].name || "",
                                        type: vessels[i].type,
                                        x: vessels[i].x,
                                        y: vessels[i].y,
                                        angle: vessels[i].angle,
                                        mmsi: vessels[i].mmsi || "",
                                        callSign: vessels[i].callSign || "",
                                        moored: vessels[i].moored || false,
                                        inAW: vessels[i].inAW || false
                    };

                    var vesselFeature;
                    if($scope.zoomLvl > 8) {
                        vesselFeature = maritimeweb.createVesselFeature(vesselData);
                    }else{
                        vesselFeature = maritimeweb.createMinimalVesselFeature(vesselData);
                    }
                    $scope.vesselsonmap.push(vesselFeature);
                }

                var vectorSource = new ol.source.Vector({
                    features: $scope.vesselsonmap //add an array of vessel features
                });

                vesselVectorLayer = new ol.layer.Vector({
                    name: "vesselVectorLayer",
                    title: "Vessels - AIS data",
                    source: vectorSource
                });
                $scope.vesselsStatus = "OK";
                firstRun = false;

                maritimeweb.groupVessels.getLayers().push(vesselVectorLayer);

            }).error(function (data, status) {
                console.log("could not retrieve ais data" + status);
                $scope.vesselsStatus = status;

            });

        };
        // update the map when a move ends.
        maritimeweb.map.on('moveend', refreshVessels );

    });
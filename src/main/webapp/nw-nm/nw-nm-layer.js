/**
 * Defines the main NW-NM message layer. navigational warnings and notices to mariners
 *
 * TODO: Lifecycle management, convert to use backend data...
 */
angular.module('maritimeweb.nw-nm')

    /** Service for accessing NW-NMs **/
    .service('NwNmService', ['$http', '$uibModal',
        function($http, $uibModal) {

            this.serviceID = function(){ return 'urn:mrnx:mcl:service:dma:nw-nm:rest'};
            this.serviceVersion = function(){ return '0.1'};
            /**
             * Returns the published NW-NM messages
             */
            this.getPublishedNwNm = function (instanceIds, lang, mainType, wkt) {
                var params = lang ? 'lang=' + lang : 'lang=en';
                angular.forEach(instanceIds, function (instanceId) {
                    params += '&instanceId=' + encodeURIComponent(instanceId);
                });
                if (mainType) {
                    params += '&mainType=' + mainType;
                }
                if (wkt) {
                    params += '&wkt=' + encodeURIComponent(wkt);
                }

                return $http.get('/rest/nw-nm/messages?' + params);
            };


            /**
             * Get NW-NM services
             */
            this.getNwNmServices = function (wkt) {
                var params = wkt ? '?wkt=' + encodeURIComponent(wkt) : '';
                var pathParam1 = encodeURIComponent(this.serviceID());
                var pathParam2 = encodeURIComponent(this.serviceVersion());
                var request = '/rest/service/lookup/' + pathParam1 + '/' + pathParam2 + params;
                return $http.get(request);
            };


            /** Open the message details dialog **/
            this.showMessageInfo = function (message) {
                return $uibModal.open({
                    controller: "MessageDialogCtrl",
                    templateUrl: "nw-nm/message-details-dialog.html",
                    size: 'lg',
                    resolve: {
                        message: function () {
                            return message;
                        }
                    }
                });
            };

            /** Returns the area heading for the given message, i.e. two root-most areas **/
            this.getAreaHeading = function (message) {
                if (message && message.areas && message.areas.length > 0) {
                    var area = message.areas[0];
                    while (area.parent && area.parent.parent) {
                        area = area.parent;
                    }
                    var heading = '';
                    if (area.parent) {
                        heading += area.parent.descs[0].name + ' - ';
                    }
                    heading += area.descs[0].name;
                    return heading;
                }
                return '';
            }
        }])



        
    /**
     * The map-nw-nm-layer directive supports drawing a list of messages or a single message on a map layer
     */
    .directive('mapNwNmLayer', ['$rootScope', '$timeout', 'MapService', 'NwNmService',
        function ($rootScope, $timeout, MapService, NwNmService) {
            return {
                restrict: 'E',
                require: '^olMap',
                template: // TODO this element is no longer limited to nw-nm and should be removed from this layer.!
                "<span ng-class='{hidden : !sidebarListViewShowBtn}' class='sidebar-toggle-btn' " +
                " tooltip='Toggle detailed list-view' data-toggle='tooltip' data-placement='right' title='Toggle detailed list-view'>" +
                "   <span ng-click='toggleList()' > <i class='fa fa-list fa-lg ' aria-hidden='true'></i> </span>" +
                "</span>",
                scope: {
                    name:           '@',

                    // Specify the "message" attribute for showing the geometry of a single message
                    message:        '=?',

                    // Specify the "messageList" and "services" attributes for showing and loading messages within map bounds
                    services:       '=?',
                    messageList:    '=?',

                    language:       '@',
                    showGeneral:    '@',
                    fitExtent:      '@',
                    maxZoom:        '@'
                },
                link: function(scope, element, attrs, ctrl) {
                    var olScope = ctrl.getOpenlayersScope();
                    var nwLayer;
                    var nmLayer;
                    var boundaryLayer;
                    var nwnmLayer;
                    var maxZoom = scope.maxZoom ? parseInt(scope.maxZoom) : 12;

                    scope.showDetails = scope.message !== undefined;
                    scope.generalMessages = []; // Messages with no geometry
                    scope.services = scope.services || [];


                    // MOVE AWAY FROM THIS DIRECTIVE
                    scope.sidebarListViewShowBtn = !scope.showDetails;
                    scope.showgraphSidebar = false;
                    // TODO this toggle element is no longer limited to nw-nm and should be removed from this layer.! Move to another file. Shared between layers. Vessel and nm atm.
                    scope.toggleList = function() {
                        $rootScope.showgraphSidebar = !$rootScope.showgraphSidebar;

                    };


                    olScope.getMap().then(function(map) {

                        // Clean up when the layer is destroyed
                        scope.$on('$destroy', function() {
                            if (angular.isDefined(nwnmLayer)) {
                                map.removeLayer(nwnmLayer);
                            }
                        });

                        /***************************/
                        /** NW and NM Layers      **/
                        /***************************/

                        var nwStyle = new ol.style.Style({
                            fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.2)' }),
                            stroke: new ol.style.Stroke({ color: '#8B008B', width: 1 }),
                            image: new ol.style.Icon({
                                anchor: [0.5, 0.5],
                                scale: 0.3,
                                src: '/img/nwnm/nw.png'
                            })
                        });

                        var nmStyle = new ol.style.Style({
                            fill: new ol.style.Fill({ color: 'rgba(255, 0, 255, 0.2)' }),
                            stroke: new ol.style.Stroke({ color: '#8B008B', width: 1 }),
                            image: new ol.style.Icon({
                                anchor: [0.5, 0.5],
                                scale: 0.3,
                                src: '/img/nwnm/nm.png'
                            })
                        });

                        var bufferedStyle = new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(100, 50, 100, 0.2)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(100, 50, 100, 0.6)',
                                width: 1
                            })
                        });


                        var boundaryStyle = new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(255, 0, 255, 0.5)',
                                    width: 1
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 0, 255, 0.05)'
                                })
                            });



                        // Construct the boundary layers
                        boundaryLayer = new ol.layer.Vector({
                            title: 'Navigational Warnings',
                            source: new ol.source.Vector({
                                features: new ol.Collection(),
                                wrapX: false
                            }),
                            style: [ boundaryStyle ]
                        });
                        boundaryLayer.setVisible(true);


                        // Construct the NW layers
                        nwLayer = new ol.layer.Vector({
                            title: 'Navigational Warnings',
                            source: new ol.source.Vector({
                                features: new ol.Collection(),
                                wrapX: false
                            }),
                            style: function(feature) {
                                var featureStyle;
                                if (feature.get('parentFeatureId')) {
                                    featureStyle = bufferedStyle;
                                } else {
                                    featureStyle = nwStyle;
                                }
                                return [ featureStyle ];
                            }
                        });
                        nwLayer.setVisible(true);

                        // Construct the NM layers
                        nmLayer = new ol.layer.Vector({
                            title: 'Notices to Mariners',
                            source: new ol.source.Vector({
                                features: new ol.Collection(),
                                wrapX: false
                            }),
                            style: function(feature) {
                                var featureStyle;
                                if (feature.get('parentFeatureId')) {
                                    featureStyle = bufferedStyle;
                                } else {
                                    featureStyle = nmStyle;
                                }
                                return [ featureStyle ];
                            }
                        });
                        nmLayer.setVisible(true);


                        /***************************/
                        /** Message List Handling **/
                        /***************************/


                        /** Updates the service boundary layer **/
                        scope.updateServiceBoundaryLayer = function () {

                            boundaryLayer.getSource().clear();

                            if (scope.services && scope.services.length > 0) {
                                angular.forEach(scope.services, function (service) {
                                    if (service.selected && service.boundary) {
                                        try {
                                            var olFeature = MapService.wktToOlFeature(service.boundary);
                                            boundaryLayer.getSource().addFeature(olFeature);
                                        } catch (error) {
                                            console.error("Error creating boundary for " + service.boundary);
                                        }
                                    }
                                });
                            }
                        };


                        /** Returns the list of GeoJson features of all message parts **/
                        scope.getMessagePartFeatures = function (message) {
                            var g = [];
                            if (message && message.parts) {
                                angular.forEach(message.parts, function (part) {
                                    if (part.geometry && part.geometry.features && part.geometry.features.length > 0) {
                                        g.push.apply(g, part.geometry.features);
                                    }
                                })
                            }
                            return g;
                        };


                        /** Adds a single message to the layer **/
                        scope.addMessageToLayer = function (message) {
                            if (message.parts) {
                                var features = scope.getMessagePartFeatures(message);
                                angular.forEach(features, function (gjFeature) {
                                    try {
                                        var olFeature = MapService.gjToOlFeature(gjFeature);
                                        olFeature.set('message', message);
                                        if (message.mainType == 'NW') {
                                            nwLayer.getSource().addFeature(olFeature);
                                        } else {
                                            nmLayer.getSource().addFeature(olFeature);
                                        }
                                    } catch (err) {
                                    }
                                });
                            } else {
                                scope.generalMessages.push(message);
                            }
                        };


                        /** Updates the message and boundary layers from the current NW-NM service selection **/
                        scope.updateMessageListLayers = function () {

                            nwLayer.getSource().clear();
                            nmLayer.getSource().clear();
                            scope.generalMessages.length = 0;

                            if (scope.messageList && scope.messageList.length > 0) {
                                angular.forEach(scope.messageList, scope.addMessageToLayer);
                            }

                        };


                        /** Returns the list of messages for the given pixel **/
                        scope.getMessagesForPixel = function (pixel) {
                            var messageIds = {};
                            var messages = [];
                            map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                var msg = feature.get('message');
                                if ((layer == nwLayer || layer == nmLayer) && msg && messageIds[msg.id] === undefined) {
                                    messages.push(msg);
                                    messageIds[msg.id] = msg.id;
                                }
                            });
                            return messages;
                        };


                        /***************************/
                        /** Map creation          **/
                        /***************************/

                        // Construct NW-NM layer
                        nwnmLayer = new ol.layer.Group({
                            title: scope.name || 'NW-NM',
                            layers: [ boundaryLayer, nwLayer, nmLayer ]
                        });
                        nwnmLayer.setVisible(true);
                        map.addLayer(nwnmLayer);


                        if (scope.showDetails) {

                            scope.addMessageToLayer(scope.message);

                        } else {

                            // Listen for changes that should cause updates to the layers
                            scope.$watch("services", scope.updateServiceBoundaryLayer, true);
                            scope.$watch("messageList", scope.updateMessageListLayers, true);
                            nwnmLayer.on('change:visible', scope.updateMessageListLayers);


                            map.on('click', function(evt) {
                                var messages = scope.getMessagesForPixel(map.getEventPixel(evt.originalEvent));
                                if (messages.length >= 1) {
                                    NwNmService.showMessageInfo(messages[0]);
                                }
                            });
                        }

                        if (scope.fitExtent == 'true') {
                            var fitExtent = false;
                            var extent = ol.extent.createEmpty();
                            if (nwLayer.getSource().getFeatures().length > 0) {
                                ol.extent.extend(extent, nwLayer.getSource().getExtent());
                                fitExtent = true;
                            }
                            if (nmLayer.getSource().getFeatures().length > 0) {
                                ol.extent.extend(extent, nmLayer.getSource().getExtent());
                                fitExtent = true;
                            }
                            if (fitExtent) {
                                map.getView().fit(extent, map.getSize(), {
                                    padding: [20, 20, 20, 20],
                                    maxZoom: maxZoom
                                });
                            }
                        }

                    });
                }
            };
        }])


    /*******************************************************************
     * Controller that handles displaying message details in a dialog
     *******************************************************************/
    .controller('MessageDialogCtrl', ['$scope', '$window', 'MapService', 'message',
        function ($scope, $window, MapService, message) {
            'use strict';

            $scope.warning = undefined;
            $scope.msg = message;

            $scope.hasGeometry = function () {
                if ($scope.msg && $scope.msg.parts) {
                    for (var x = 0; x < $scope.msg.parts.length; x++) {
                        var part = $scope.msg.parts[x];
                        if (part.geometry) {
                            return true;
                        }
                    }
                }
                return false;
            };

        }]);


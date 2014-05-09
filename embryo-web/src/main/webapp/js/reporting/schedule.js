(function() {
    "use strict";

    var berthUrl = embryo.baseUrl + 'rest/berth/search';

    var scheduleModule = angular.module('embryo.schedule', [ 'embryo.scheduleService', 'embryo.routeService',
            'siyfion.sfTypeahead', 'embryo.position' , 'embryo.vessel', 'ui.bootstrap']);
    
    var voyages = [];
    var pageSize = 5;
    
    var berths = new Bloodhound({
        datumTokenizer : Bloodhound.tokenizers.obj.nonword('value'),
        queryTokenizer : Bloodhound.tokenizers.whitespace, 
        prefetch : {
            url : berthUrl,
            // 1 time
            ttl : 3600000
        },
        remote : berthUrl
    });
    berths.initialize();

    embryo.ScheduleCtrl = function($scope, $q, VesselService, ScheduleService, RouteService, VesselInformation) {
        var idExists = function(voyages, id) {
            for(var vid in voyages) {
                if(voyages[vid].maritimeId == id) {
                    return vid;
                }
            }
            return false;
        };

        var loadSchedule = function(vs) {
            if ($scope.mmsi) {
                $scope.alertMessages = [];
                ScheduleService.getYourSchedule($scope.mmsi, function(schedule) {
                    $scope.idsOfVoyages2Delete = [];
                    voyages = schedule.voyages.slice();
                    if(vs) {
                        for(var i = vs.length - 1; i > -1; i--) {
                            var id = vs[i].maritimeId;
                            var foundVoyageId = idExists(voyages, id);
                            if(foundVoyageId) {
                                voyages[foundVoyageId] = vs[i];
                                vs.splice(i, 1);
                            }
                        }
                        voyages = voyages.concat(vs);
                    }
                    voyages.push({});
                    $scope.voyages = voyages.slice(0, pageSize);
                    $scope.allVoyages = voyages.length;
                    $("#schedulePanel").css("display", "block");
                }, function(error) {
                    $scope.alertMessages = error;
                });
            }
        };

        embryo.controllers.schedule = {
            title : "Schedule",
            available : function(vesselOverview, vesselDetails) {
                if (vesselOverview.inAW) {
                    if (vesselDetails.additionalInformation.routeId)
                        return {
                            text : "ACTIVE",
                            klass : "success",
                            action : "edit"
                        };
                    else
                        return {
                            text : "INACTIVE",
                            klass : "warning",
                            action : "edit"
                        };
                }
                return false;
            },
            show : function(vesselOverview, vesselDetails) {
                $scope.mmsi = vesselDetails.mmsi;
                $scope.vesselDetails = vesselDetails;
                $scope.activeRouteId = vesselDetails.additionalInformation.routeId;
                loadSchedule();
                $scope.$apply();
            },
            close : function() {
                $scope.reset();
            },
            updateSchedule : function(data) {
                loadSchedule(data.voyages);
                $scope.alertMessages = data.errors;
            }
        };
        
        VesselInformation.addInformationProvider(embryo.controllers.schedule);

        $scope.options = {
            "Yes" : true,
            "No" : false
        };

        /*$scope.berths = {
            displayKey : 'value',
            source : berths.ttAdapter()
        };*/
        //$scope.berths = ['test','test2'];
        $scope.getBerths = function(query) {
            return function() {
                var deferred = $q.defer();
                berths.get(query, function(suggestions) {
                    deferred.resolve(suggestions);
                });
                return deferred.promise;
            }().then(function(res) {
                return res;
            });
        };
        

        $scope.getLastVoyage = function() {
            if (!$scope.voyages) {
                return null;
            }
            return $scope.voyages[$scope.voyages.length - 1];
        };
        
        $scope.$watch($scope.getLastVoyage, function(newValue, oldValue) {
            // add extra empty voyage on initialization
            if (newValue && Object.keys(newValue).length > 0 && (!oldValue || Object.keys(oldValue).length === 0)) {
                $scope.voyages.push({});
            }
        }, true);
        
        $scope.moreVoyages = function() {
            return $scope.voyages && $scope.voyages.length < voyages.length;
        };
        
        $scope.loadAll = function() {
            $scope.voyages = voyages;
            //$scope.$apply();
        };

        $scope.loadMore = function() {
            if($scope.voyages) {
                var vl = $scope.voyages.length;
                if(vl < voyages.length) {
                    $scope.voyages = voyages.slice(0, vl + pageSize);
                }
            }
        };

        $scope.del = function(index) {
            if ($scope.voyages[index].maritimeId) {
                $scope.idsOfVoyages2Delete.push($scope.voyages[index].maritimeId);
            }
            voyages.splice(index, 1);
            $scope.voyages.splice(index, 1);
        };

        $scope.isActive = function(voyage) {
            if (!voyage || !voyage.route || !voyage.route.id) {
                return false;
            }

            if (!$scope.activeRoute) {
                return false;
            }

            return $scope.activeRouteId === voyage.route.id;
        };

        $scope.editRoute = function(index) {
            var context = {
                mmsi : $scope.mmsi,
                routeId : $scope.voyages[index].route ? $scope.voyages[index].route.id : null,
                voyageId : $scope.voyages[index].maritimeId,
                dep : $scope.voyages[index].location,
                etdep : $scope.voyages[index].departure,
                vesselDetails : $scope.vesselDetails
            };
            if (index < $scope.voyages.length - 1) {
                context.des = $scope.voyages[index + 1].location;
                context.etdes = $scope.voyages[index + 1].arrival;
            }

            embryo.controllers.editroute.show(context);
        };

        $scope.uploadRoute = function(voyage) {
            embryo.controllers.uploadroute.show({
                vesselDetails : $scope.vesselDetails,
                voyageId : voyage.maritimeId
            });
        };
        
        $scope.uploadSchedule = function() {
            var biggestDate = 0;
            for(var x in voyages) {
                var departure = voyages[x].departure;
                if(departure > biggestDate) {
                    biggestDate = departure;
                }
            }
            embryo.controllers.uploadroute.show({
                schedule : true,
                departure : biggestDate
            });
        };

        $scope.activate = function(voyage) {
            resetMessages();
            RouteService.setActiveRoute(voyage.route.id, true, function() {
                VesselService
                        .updateVesselDetailParameter($scope.mmsi, "additionalInformation.routeId", voyage.route.id);
                $scope.activeRouteId = voyage.route.id;
            }, function(error) {
                $scope.alertMessages = error;
            });
        };
        $scope.deactivate = function(voyage) {
            resetMessages();
            RouteService.setActiveRoute(voyage.route.id, false, function() {
                VesselService.updateVesselDetailParameter($scope.mmsi, "additionalInformation.routeId", "");
                $scope.activeRouteId = null;
            }, function(error) {
                $scope.alertMessages = error;
            });
        };

        function resetMessages() {
            $scope.message = null;
            $scope.alertMessages = null;
        }

        $scope.reset = function() {
            resetMessages();
            $scope.idsOfVoyages2Delete = [];
            loadSchedule();
        };
        
        $scope.saveable = function() {
            if ($scope.scheduleEditForm.$invalid) {
                return false;
            }

            if (!(($scope.voyages && $scope.voyages.length >= 1) || ($scope.idsOfVoyages2Delete && $scope.idsOfVoyages2Delete.length > 0))) {
                return false;
            }

            return true;
        };

        $scope.save = function() {
            var index = null;
            // remove last empty element
            var scheduleRequest = {
                mmsi : $scope.mmsi,
                voyages : $scope.voyages.slice(0, $scope.voyages.length - 1),
                toDelete : $scope.idsOfVoyages2Delete
            };

            for (index in scheduleRequest.voyages) {
                delete scheduleRequest.voyages[index].route;
            }

            resetMessages();
            ScheduleService.save(scheduleRequest, function() {
                $scope.message = "Schedule saved successfully";
                loadSchedule();
            }, function(error) {
                $scope.alertMessages = error;
            });
        };
    };
    
    embryo.VoyageCtrl = function($scope) {
        function berthSelected(e, suggestion, dataset){
            var voyage = $scope.$parent.voyage;
            voyage.latitude = suggestion.latitude;
            voyage.longitude = suggestion.longitude;
            voyage.location = suggestion.value;
            $scope.$apply();
        };
        
        $scope.$on('typeahead:selected', berthSelected);
        $scope.$on('typeahead:autocompleted', berthSelected);

        $scope.getCoords = function(item, model, label) {
            var voyage = $scope.$parent.voyage;
            voyage.latitude = item.latitude;
            voyage.longitude = item.longitude;
            //$scope.$apply();
        };

    };

    embryo.ScheduleViewCtrl = function($scope, ScheduleService, RouteService, $timeout) {
        $scope.collapse = false;
        
        var loadSchedule = function() {
            if ($scope.mmsi) {
                ScheduleService.getSchedule($scope.mmsi, function(schedule) {
                    $scope.voyages = schedule.voyages.slice();
                    $("#scheduleViewPanel").css("display", "block");
                });
            }
        };

        $scope.routeLayer = RouteLayerSingleton.getInstance();

        $scope.scheduleLayer = new ScheduleLayer("#000000");
        addLayerToMap("vessel", $scope.scheduleLayer, embryo.map);

        embryo.controllers.scheduleView = {
            title : "Schedule",
            available : function(vesselOverview, vesselDetails) {
                return vesselDetails.additionalInformation.schedule;
            },
            show : function(vesselOverview, vesselDetails) {
                $scope.collapse = false;
                $scope.mmsi = vesselDetails.mmsi;
                $scope.activeRouteId = vesselDetails.additionalInformation.routeId;
                loadSchedule();
            },
            close : function() {
                $scope.routeLayer.clear();
                $scope.scheduleLayer.clear();
            }
        };

        $scope.isActive = function(voyage) {
            if (!voyage || !voyage.route || !voyage.route.id) {
                return false;
            }

            if (!$scope.activeRoute) {
                return false;
            }

            return $scope.activeRouteId === voyage.route.id;
        };

        $scope.formatLatitude = function(latitude) {
            return formatLatitude(latitude);
        };

        $scope.formatLongitude = function(latitude) {
            return formatLongitude(latitude);
        };

        $scope.formatDateTime = function(timeInMillis) {
            return formatTime(timeInMillis);
        };

        $scope.view = function() {
            $scope.collapse = true;
            $scope.scheduleLayer.draw($scope.voyages);
            $scope.scheduleLayer.zoomToExtent();
        };

        $scope.viewRoute = function(voyage) {
            $scope.collapse = true;
            RouteService.getRoute(voyage.route.id, function(route) {
                var routeType = embryo.route.service.getRouteType($scope.mmsi, voyage.route.id); 
                $scope.routeLayer.draw(route, routeType);
                $scope.routeLayer.zoomToExtent();
            });
        };

    };
    
    // This is where we implement the "infinite scrolling" part for large datasets.
    // Usage: x-when-scrolled="loadMore()" <-- see that method for more info
    scheduleModule.directive('whenScrolled', function() {
        return function(scope, elm, attr) {
            var div = elm.parent().parent();
            var raw = div[0];
            div.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        };
    });
    
    /*scheduleModule.directive('eLocationTypeahead', function() {
        return {
            restrict : 'C',
            require: ['ngModel'],
            link : function(scope, elm, attr, ctrls) {
                elm.bind('click', function() {
                    var ev = $.Event("keydown");
                    ev.keyCode = ev.which = 40;
                    $(this).trigger(ev);
                    return true;
                });
                elm.bind('keydown', function(e) {
                    if(e.keyCode == 40) {
                        //if(scope.matches.length < 1) {
                            ctrls[0].$setViewValue('');
                        //}
                    }
                });
            }
        }; 
    });*/

}());

$(function () {

//    var msiLayer = new MsiLayer();
//    addLayerToMap("msi", msiLayer, embryo.map);

    var module = angular.module('embryo.sar.views', ['embryo.sar.service', 'embryo.common.service', 'ui.bootstrap.typeahead', 'embryo.validation.compare', 'embryo.datepicker']);


    module.directive('lteq', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelController) {
                var path = attr.lteq.split('.');

                function comparedTo() {
                    var value = scope;
                    for (var index in path) {
                        var v = path[index];
                        value = value[v];
                    }
                    return value
                }

                function valid(value1, value2) {
                    return value1 <= value2;
                }

                //For DOM -> model validation
                ngModelController.$parsers.unshift(function (value) {
                    var otherValue = comparedTo();
                    ngModelController.$setValidity('lteq', valid(value, otherValue));
                    return value;
                });

                //For model -> DOM validation
                ngModelController.$formatters.unshift(function (value) {
                    var otherValue = comparedTo();
                    ngModelController.$setValidity('lteq', valid(value, otherValue));
                    return value;
                });
            }
        };
    });

    function SarTypeData(text, img) {
        this.text = text;
        this.img = img;
    }

    //var sarTypes = embryo.sar.Operation;
    var sarTypeDatas = {}
    sarTypeDatas[embryo.sar.Operation.RapidResponse] = new SarTypeData("Rapid response", "/img/sar/generic.png");
    sarTypeDatas[embryo.sar.Operation.DatumPoint] = new SarTypeData("Datum point", "/img/sar/datumpoint.png");
    sarTypeDatas[embryo.sar.Operation.DatumLine] = new SarTypeData("Datum line", "/img/sar/datumline.png");
    sarTypeDatas[embryo.sar.Operation.BackTrack] = new SarTypeData("Back track", "/img/sar/generic.png")

    module.controller("SAROperationEditController", ['$scope', 'ViewService', 'SarService', '$q', 'LivePouch',
        function ($scope, ViewService, SarService, $q, LivePouch) {

            $scope.alertMessages = [];

            function initNewSar() {
                var now = Date.now();
                $scope.sar = {
                    type: embryo.sar.Operation.RapidResponse,
                    no: SarService.createSarId(),
                    searchObject: $scope.searchObjects[0].id,
                    yError: 0.1,
                    safetyFactor: 1.0,
                    startTs: now + 1000 * 60 * 60
                }

                $scope.sarOperation = {}

                if (!$scope.sar.surfaceDriftPoints) {
                    $scope.sar.surfaceDriftPoints = [{}];
                }
                if (!$scope.sar.surfaceDriftPoints[0].ts) {
                    $scope.sar.surfaceDriftPoints[0].ts = now;
                }

                if ($scope.sar.type != embryo.sar.Operation.DatumLine) {
                    if (!$scope.sar.lastKnownPosition) {
                        $scope.sar.lastKnownPosition = {};
                }
                    if (!$scope.sar.lastKnownPosition.ts) {
                        $scope.sar.lastKnownPosition.ts = now;
                    }
                }
            }

        $scope.provider = {
            doShow: false,
            title: "Create SAR",
            type: "newSar",
            show: function (context) {
                $scope.page = context && context.page ? context.page : 'typeSelection'
                if (context.sarId) {
                    LivePouch.get(context.sarId).then(function (sarOperation) {
                        $scope.sarOperation = sarOperation;
                        $scope.sar = sarOperation.input;
                        $scope.$apply(function () {
                        });
                    })
                } else {
                    initNewSar();
                }

                this.doShow = true;
            },
            close: function () {
                this.doShow = false;
            }
        };
        ViewService.addViewProvider($scope.provider);

        $scope.close = function ($event) {
            $event.preventDefault();
            $scope.provider.close();
        };

        $scope.searchObjects = SarService.searchObjectTypes();
            $scope.sarTypes = embryo.sar.Operation;
            $scope.sarTypeValues = [embryo.sar.Operation.RapidResponse, embryo.sar.Operation.DatumPoint, embryo.sar.Operation.DatumLine, embryo.sar.Operation.BackTrack];
        $scope.sarTypeDatas = sarTypeDatas;

            $scope.tmp = {
                sarTypeData: $scope.sarTypeDatas[0]
        }

        $scope.getDirections = function (query) {
            return function () {
                var deferred = $q.defer();
                var result = SarService.queryDirections(query);
                deferred.resolve(result);
                return deferred.promise;
            }().then(function (res) {
                return res;
            });

        }

        $scope.back = function () {
            switch ($scope.page) {
                case ("sarResult") :
                {
                    $scope.alertMessages = []
                    $scope.page = 'sarInputs';
                    break;
                }
                case ("sarInputs") :
                {
                    $scope.alertMessages = []
                    $scope.page = 'typeSelection';
                    break;
                }
            }
        }

        $scope.next = function () {
            $scope.page = 'sarInputs';
        }


        $scope.createSarOperation = function () {
            var sarInput = $scope.sar;
            try {
                $scope.alertMessages = [];
                // retain PouchDB fields like _id and _rev
                var calculatedOperation = SarService.createSarOperation(sarInput);
                $scope.sarOperation.docType = embryo.sar.Type.SearchArea;
                $scope.sarOperation.input = calculatedOperation.input;
                $scope.sarOperation.output = calculatedOperation.output;
                $scope.tmp.searchObject = SarService.findSearchObjectType($scope.sarOperation.input.searchObject);
                $scope.page = 'sarResult';
            } catch (error) {
                if (typeof error === 'object' && error.message) {
                    $scope.alertMessages.push("Internal error: " + error.message);
                    throw error;
                } else if (typeof error === 'string') {
                    $scope.alertMessages.push("Internal error: " + error);
                }
            }
        }

        $scope.formatTs = formatTime;
        $scope.formatPos = function (position) {
            if (!position) {
                return ""
            }
            return "(" + formatLatitude(position.lat) + ", " + formatLongitude(position.lon) + ")";
        }

        $scope.formatDecimal = embryo.Math.round10;

        $scope.addPoint = function () {
            $scope.sar.surfaceDriftPoints.push({});
        }

        $scope.removePoint = function () {
            if ($scope.sar.surfaceDriftPoints.length > 1) {
                $scope.sar.surfaceDriftPoints.splice($scope.sar.surfaceDriftPoints.length - 1, 1);
            }
        }

        $scope.finish = function () {
            if (!$scope.sarOperation._id) {
                $scope.sarOperation._id = "sar-" + Date.now();
                $scope.sarOperation.status = embryo.SARStatus.STARTED;
            }

            LivePouch.put($scope.sarOperation).then(function () {
                SarService.selectSar($scope.sarOperation._id);
                $scope.provider.doShow = false;
            }).catch(function (err) {

            });
        }

            $scope.end = function () {
                var id = $scope.sarOperation._id;

                LivePouch.get(id).then(function (sar) {
                    sar.status = embryo.SARStatus.ENDED;
                    LivePouch.put(sar).then(function () {
                        $scope.provider.doShow = false;
                        SarService.selectSar(null);
                    }).catch(function (err) {
                        console.log(err)
                });
                });
        }
    }]);

    var targetText = {};
    targetText[embryo.sar.effort.TargetTypes.PersonInWater] = "Person in Water (PIW)";
    targetText[embryo.sar.effort.TargetTypes.Raft1Person] = "Raft 1 person";
    targetText[embryo.sar.effort.TargetTypes.Raft4Persons] = "Raft 4 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft6Persons] = "Raft 6 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft8Persons] = "Raft 8 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft10Persons] = "Raft 10 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft15Persons] = "Raft 15 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft20Persons] = "Raft 20 persons";
    targetText[embryo.sar.effort.TargetTypes.Raft25Persons] = "Raft 25 persons";
    targetText[embryo.sar.effort.TargetTypes.Motorboat15] = "Motorboat <= 15 feet";
    targetText[embryo.sar.effort.TargetTypes.Motorboat20] = "Motorboat 20 feet";
    targetText[embryo.sar.effort.TargetTypes.Motorboat33] = "Motorboat 33 feet";
    targetText[embryo.sar.effort.TargetTypes.Motorboat53] = "Motorboat 53 feet";
    targetText[embryo.sar.effort.TargetTypes.Motorboat78] = "Motorboat 78 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat15] = "Sailboat 15 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat20] = "Sailboat 20 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat25] = "Sailboat 25 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat30] = "Sailboat 30 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat40] = "Sailboat 40 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat50] = "Sailboat 50 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat70] = "Sailboat 70 feet";
    targetText[embryo.sar.effort.TargetTypes.Sailboat83] = "Sailboat 83 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship120] = "Ship 120 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship225] = "Ship 225 feet";
    targetText[embryo.sar.effort.TargetTypes.Ship330] = "Ship >= 300 feet";

    function targetTypes() {
        return [
            embryo.sar.effort.TargetTypes.PersonInWater,
            embryo.sar.effort.TargetTypes.Raft1Person,
            embryo.sar.effort.TargetTypes.Raft4Persons,
            embryo.sar.effort.TargetTypes.Raft6Persons,
            embryo.sar.effort.TargetTypes.Raft8Persons,
            embryo.sar.effort.TargetTypes.Raft10Persons,
            embryo.sar.effort.TargetTypes.Raft15Persons,
            embryo.sar.effort.TargetTypes.Raft20Persons,
            embryo.sar.effort.TargetTypes.Raft25Persons,
            embryo.sar.effort.TargetTypes.Motorboat15,
            embryo.sar.effort.TargetTypes.Motorboat20,
            embryo.sar.effort.TargetTypes.Motorboat33,
            embryo.sar.effort.TargetTypes.Motorboat53,
            embryo.sar.effort.TargetTypes.Motorboat78,
            embryo.sar.effort.TargetTypes.Sailboat15,
            embryo.sar.effort.TargetTypes.Sailboat20,
            embryo.sar.effort.TargetTypes.Sailboat25,
            embryo.sar.effort.TargetTypes.Sailboat30,
            embryo.sar.effort.TargetTypes.Sailboat40,
            embryo.sar.effort.TargetTypes.Sailboat50,
            embryo.sar.effort.TargetTypes.Sailboat70,
            embryo.sar.effort.TargetTypes.Sailboat83,
            embryo.sar.effort.TargetTypes.Ship120,
            embryo.sar.effort.TargetTypes.Ship225,
            embryo.sar.effort.TargetTypes.Ship330
        ];
    }

    var typeText = {}
    typeText[embryo.sar.effort.VesselTypes.SmallerVessel] = "Small vessel (40 feet)";
    typeText[embryo.sar.effort.VesselTypes.Ship] = "Ship (50 feet)";

    var AllocationStatusTxt = {};
    AllocationStatusTxt[embryo.sar.effort.Status.Active] = "Shared";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftSRU] = "No zone";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftZone] = "Not shared";
    AllocationStatusTxt[embryo.sar.effort.Status.DraftModifiedOnMap] = "Not shared";

    var AllocationStatusLabel = {};
    AllocationStatusLabel[embryo.sar.effort.Status.Active] = "label-success";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftSRU] = "label-danger";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftZone] = "label-danger";
    AllocationStatusLabel[embryo.sar.effort.Status.DraftModifiedOnMap] = "label-danger";


    module.controller("SarEffortAllocationController", ['$scope', 'ViewService', 'SarService', 'LivePouch', '$timeout',
        function ($scope, ViewService, SarService, LivePouch, $timeout) {
            $scope.alertMessages = [];
            $scope.message = null;
            $scope.srus = [];

            $scope.AllocationStatus = embryo.sar.effort.Status;

            $scope.AllocationStatusTxt = AllocationStatusTxt;
            $scope.AllocationStatusLabel = AllocationStatusLabel;

            $scope.fatigues = [0.5, 1.0];
            $scope.targetText = targetText;
            $scope.targetTypes = targetTypes();

            $scope.typeText = typeText;
            $scope.vesselTypes = [
                embryo.sar.effort.VesselTypes.SmallerVessel,
                embryo.sar.effort.VesselTypes.Ship
            ]

            $scope.visibilityValues = [1, 3, 5, 10, 15, 20];


            function loadAllocation(allocationId) {
                // find docs where sarId === selectedSarId
                LivePouch.get(allocationId).then(function (allocation) {
                    $scope.effort = allocation;
                    $scope.initEffortAllocation();
                    $scope.$apply(function () {
                    })
                }).catch(function (error) {
                    console.log("loadAllocation error")
                    console.log(error)
                });
            }

            function loadSRUs() {
                $scope.srus = []
                // find docs where sarId === selectedSarId
                LivePouch.query('sareffortview', {
                    key: $scope.sarId,
                    include_docs: true
                }).then(function (result) {
                    $timeout(function () {
                        var srus = [];
                        for (var index in result.rows) {
                            srus.push(result.rows[index].doc)
                        }
                        $scope.srus = srus
                    }, 10)
                }).catch(function (error) {
                    console.log("sareffortview error")
                    console.log(error)
                });
            }

            $scope.provider = {
                doShow: false,
                title: "SarEffortAllocation",
                type: "effort",
                show: function (context) {
                    $scope.alertMessages = null;
                    $scope.message = null;
                    $scope.page = context && context.page ? context.page : 'SRU';
                    if (context && context.sarId) {
                        $scope.sarId = context.sarId
                        $scope.toSrus();
                    } else if (context && context.allocationId) {
                        loadAllocation(context.allocationId)
                    }

                    this.doShow = true;

                },
                close: function () {
                    this.doShow = false;
                }
            };
            ViewService.addViewProvider($scope.provider);

            $scope.close = function ($event) {
                $event.preventDefault();
                $scope.provider.close();
            };

            $scope.newUnit = function () {
                $scope.sru = {
                    fatigue: 1.0,
                    type: embryo.sar.effort.VesselTypes.SmallerVessel,
                    time: 1
                }
                $scope.page = 'editUnit';
            };


            function clone(object) {
                return JSON.parse(JSON.stringify(object));
            }

            $scope.editSRU = function ($event, SRU) {
                $event.preventDefault();
                $scope.sru = clone(SRU);
                $scope.page = 'editUnit';
            }

            $scope.toConfirmDelSRU = function ($event, SRU) {
                $event.preventDefault();
                $scope.sru = SRU;
                $scope.page = 'deleteSRU';
            }

            $scope.removeSRU = function (SRU) {
                console.log("remove SRU")
                console.log(SRU)

                LivePouch.remove(SRU).then(function (result) {
                    console.log("succes removing document")
                    console.log(result);
                    $scope.toSrus();
                }).catch(function (error) {
                    $scope.alertMessages = ["Internal eror removing SRU", error];
                    console.log("error removing sru")
                    console.log(error)
                })
            }

            $scope.toSrus = function () {
                loadSRUs();
                $scope.page = "SRU";
            }

            $scope.saveUnit = function () {
                // If active, then make a new copy in status draft
                // the copy will replace the active zone, when itself being activated
                var sru = clone($scope.sru);
                if (sru.status === embryo.sar.effort.Status.Active) {
                    delete sru._id;
                    delete sru._rev;
                    delete sru.area;
                }
                if (sru.status === embryo.sar.effort.Status.DraftZone) {
                    delete sru.area;
                    sru.status = embryo.sar.effort.Status.DraftSRU;
                }
                if (!sru._id) {
                    sru.effSarId = $scope.sarId;
                    sru._id = "saref-" + Date.now();
                    sru.docType = embryo.sar.Type.EffortAllocation;
                    sru.status = embryo.sar.effort.Status.DraftSRU;
                }
                var sru2 = $scope.sru;
                // FIXME can not rely on local computer time
                sru.modified = Date.now();
                $scope.sru = null;
                LivePouch.put(sru).then(function (result) {
                    $scope.toSrus();
                }).catch(function (error) {
                    console.log(error)
                    $scope.sru = sru2;
                    $scope.alertMessages = ["internal error", error];
                });

            }

            $scope.initEffortAllocation = function () {
                if (!$scope.effort) {
                    $scope.effort = {}
                }

                var latest = SarService.latestEffortAllocationZone($scope.srus);

                if (!$scope.effort.target) {
                    $scope.effort.target = latest ? latest.target : embryo.sar.effort.TargetTypes.PersonInWater;
                }
                if (!$scope.effort.visibility) {
                    $scope.effort.visibility = latest ? latest.visibility : $scope.visibilityValues[0];
                }
                if (!$scope.effort.pod) {
                    $scope.effort.pod = latest ? latest.pod : 78;
                }
                if (!$scope.effort.waterElevation && latest) {
                    $scope.effort.waterElevation = latest.waterElevation;
                }
                if (!$scope.effort.wind && latest) {
                    $scope.effort.wind = latest.wind;
                }
            }

            $scope.toZoneCalculation = function (effort) {
                $scope.effort = effort;
                $scope.initEffortAllocation();
                $scope.page = "effort";
            }

            $scope.confirmActivation = function (effort) {
                $scope.effort = effort;
                $scope.page = "activate";
            }

            $scope.calculate = function () {
                LivePouch.get($scope.effort.effSarId).then(function (sar) {
                    var allocations = null;
                    try {
                        console.log("before calculation");
                        allocations = SarService.calculateEffortAllocations([$scope.effort], sar);
                        console.log("after calculation")
                    } catch (error) {
                        $scope.alertMessages = ["internal error", error];
                    }

                    if (allocations) {
                        for (var index in allocations) {
                            LivePouch.put(allocations[index]).then(function () {
                                // TODO fix problem. View closing after first save
                                $scope.provider.close();
                                $scope.$apply(function () {
                                });
                            }).catch(function (error) {
                                console.log(error)
                                $scope.alertMessages = ["internal error", error];
                                $scope.$apply(function () {
                                });
                            });
                        }
                    }

                    $scope.$apply(function () {
                    });
                }).catch(function (error) {
                    console.log(error)
                    $scope.alertMessages = ["internal error", error];
                    $scope.$apply(function () {
                    });
                });
            }

            $scope.activate = function () {
                // CONFIRM calculation and movement within circle before sending to other vessels
                // this to minimize data traffic
                function persist(eff) {
                    var effort = clone(eff);
                    effort.status = embryo.sar.effort.Status.Active;
                    // FIXME can not rely on local computer time
                    effort.modified = Date.now();
                    LivePouch.put(effort).then(function () {
                        console.log("done with success")
                        $scope.toSrus();
                    }).catch(function (error) {
                        console.log("error saving effort allocation")
                        console.log(error)
                    })
                }

                function deleteEffortAllocationsForSameUser(effort) {
                    LivePouch.query('sareffortview', {
                        key: effort.sarId,
                        include_docs: true
                    }).then(function (result) {
                        $timeout(function () {
                            var efforts = [];
                            for (var index in result.rows) {
                                if (result.rows[index].doc.name == effort.name && result.rows[index].doc._id !== effort._id) {
                                    efforts.push(result.rows[index].doc)
                                    result.rows[index].doc._deleted = true;
                                }
                            }
                            //delete similar efforts
                            LivePouch.bulkDocs(efforts).then(function (result) {
                                console.log("deleted docs")
                                console.log("persisting effort")

                                persist(effort);
                            }).catch(function (err) {
                                console.log(err);
                            });
                        }, 1)
                    }).catch(function (error) {
                        console.log("sareffortview error")
                        console.log(error)
                    });
                }

                deleteEffortAllocationsForSameUser($scope.effort);
            }


        }]);

});

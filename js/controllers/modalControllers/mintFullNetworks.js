 if (typeof  modalControllers === 'undefined')
 modalControllers = {};
 modalControllers.mintFullNetworks = function($scope, $modalInstance, $http, d3, $q) {
                $scope.availableOrgList = {};
                $scope.uploadButtonEnable = true;
                $scope.state = 'uploadState';
                $scope.selectedOrgName = "";
                getAvailableOptions();

                $scope.pathwayUpload = function(selectedNetwork)
                {
                    $scope.uploadButtonEnable = false;
                    $http.get("http://www.cise.ufl.edu/~adobra/BioVerto/MINT-full/" + selectedNetwork + "_all.graph").success(function(result) {
                        $scope.blob = "Source\tTarget\tValue1\tValue2\tValue3\n" + result;
                        g5.loadGraphFromFile("mint", $scope.blob, $scope.availableOrgList[selectedNetwork], "Source", "Target");
                        $modalInstance.close({layout: "force", graphName: $scope.availableOrgList[selectedNetwork]});
                    });

                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
                function getAvailableOptions() {
                    var organismsListHttp = $http.get('http://www.cise.ufl.edu/~adobra/BioVerto/rest/list/organism-all');
                    $q.all([organismsListHttp]).then(function(results) {
                        var orgNameList = {};
                        var subStructureNameList = {};
                        var rows = d3.csv.parseRows(results[0].data);
                        for (i = 0; i < rows.length; i++)
                        {
                            $scope.availableOrgList[rows[i][1]] = rows[i][0];
                        }

                    });
                }
                ;
            };
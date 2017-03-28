var nar = nar || {};
nar.pesticideReport = nar.pesticideReport || {};
/**
 * @param {array<nar.pestTimeSeries.Visualization>} timeSeriesVisualizations - an array of all possible tsv's
 * @param {nar.pestTimeSeries.VisualizationController} tsvController - all currently visualized tsv's
 */
nar.pesticideReport.Tree = function(timeSeriesVisualizations, tsvController, graphToggleElt){
    var self = this;
    
    var treeNodeIds = {}; //pseudo-set; keys are string TimeSeriesVisualization ids. Values are meaningless.
    //make new root node to enable a select all
    var treeNodes = [{
		icon: "glyphicon glyphicon-ok",
		id: "root",
		parent: "#",
		text: "Select All",
		type: "Select All"
	}];
    var mostRecentlyCreatedTimeSeriesVizId;
    
    /**
     * @param {Number} order - comparison order from ComparisonCategorization.order
     * @returns {String} for tree display
     */
    var getBenchmarkComparisonTreeIdFragment = function(order){
    	var strOrder = '' + order;
    	//Switch back to 2nd and 3rd
		var orderMap = {'1' : '', '2': 'Second', '3': 'Third'};
		var prefix = orderMap[strOrder];
		//add spaces back
		var benchmarkComparisonFragment = prefix + 'ClosesttoBenchmarks';
		return benchmarkComparisonFragment;
    };
    
    /**
     * @param {Object} comparisonCategorization - an object with keys 'category' and 'order'
     * @returns {String} a tree id fragment. Will not contain leading or trailing delims.
     * May contain delims within the string.
     */
    var comparisonCategorizationToTreeIdFragment = function(comparisonCategorization){
    	var treeIdFragment;
    	if('ABSOLUTE' === comparisonCategorization.category){
    		treeIdFragment = 'Most Frequently Detected'
			if(1 !== comparisonCategorization.order){
				throw Error('Order "' + comparisonCategorization.order + '" is unexpected. Expected "1"');
			}
    	} else {
    		treeIdFragment = getBenchmarkComparisonTreeIdFragment(comparisonCategorization.order);
    		if ('HUMAN_HEALTH' === comparisonCategorization.category) {
    			treeIdFragment += self.displayHierarchyDelim + 'Human Health';
    		} else if ('AQUATIC_LIFE' === comparisonCategorization.category){
    			treeIdFragment += self.displayHierarchyDelim + 'Aquatic Life';
    		}
    	}
    	
    	return treeIdFragment;
    };
    
    /**
     * @param {nar.pestTimeSeries.Visualization.metadata.aggregationType}
     * @param {nar.pestTimeSeries.Visualization.metadata.timeStepDensity}
     * @returns {String} a tree id fragment. Will not contain leading or trailing delims.
     * May contain delims within the string.
     */
    var aggregationTypeAndTimeStepDensityToTreeIdFragment = function(aggregationType, timeStepDensity){
    	var treeIdFragment = '';
    	if('DISCRETE' === timeStepDensity && 'NONE' === aggregationType) {
    		treeIdFragment = 'Sample Concentration';
    	} else if('MOVING_AVERAGE' === aggregationType){
    		var timeStepDensityMap = {
				'EVERY_21_DAYS' : '21 day',
				'EVERY_60_DAYS' : '60 day'
    		};
    		if(Object.has(timeStepDensityMap, timeStepDensity)){
    			treeIdFragment = timeStepDensityMap[timeStepDensity];
    		} else {
    			throw Error('Could not translate timeStepDensity "' + timeStepDensity + '" into a human-facing tree node name.');
    		}
    		treeIdFragment += ' Moving Average';
    	} else if('TIME_WEIGHTED_MEAN' === aggregationType && 'ANNUAL' === timeStepDensity){
    		treeIdFragment = 'Time-Weighted Annual Mean';
    	} else {
    		throw Error('Could not translate timeStepDensity "' + timeStepDensity + '" and aggregationType "' + aggregationType + '" into a human-facing tree node name.');
    	}
    	return treeIdFragment;
    };
    
    /**
	 * Given time series visualization components, return a hierarchical id that will produce a tree like the one in the mockups
	 *  @param {nar.pestTimeSeries.Visualization.metadata} metadata
	 *  @returns {String}, a '/'-delimited string denoting tree display hierarchy
	 */
	var getTreeDisplayHierarchy = function(metadata){
		var displayHierarchy = '';
		var comparisonCategorizationFragment = comparisonCategorizationToTreeIdFragment(metadata.comparisonCategorization);
		displayHierarchy += comparisonCategorizationFragment;
		if(metadata.comparisonCategorization.category === 'ABSOLUTE'){
			displayHierarchy += self.displayHierarchyDelim;
			if(null != metadata.constituentCategorization.subcategory){
				displayHierarchy += metadata.constituentCategorization.subcategory.replace('_', '-').capitalize();
			} else {
				throw Error('Absolute comparisons must have a subcategory defined');
			}
			displayHierarchy += ' Sample Concentration';
		} else {
			displayHierarchy += self.displayHierarchyDelim + aggregationTypeAndTimeStepDensityToTreeIdFragment(metadata.aggregationType, metadata.timeStepDensity);
		}
		return displayHierarchy;
	};
    
    self.createLeafNode = function(id, displayHierarchy){
        var leafNode = self.createTreeNode(id, displayHierarchy);
        leafNode.icon = false;
        return leafNode;
    };
    
    self.createBranchNode = function(id){
        var leafNode = self.createTreeNode(id, id);
        leafNode.icon = false;
        return leafNode;
    };
    
    self.createTreeNode = function(id, displayHierarchy){
		var text = displayHierarchy.split(self.displayHierarchyDelim).last();
        return {
          type: id,//used to look up the TimeSeriesVisualization in the TimeSeriesVisualizationRegistry
          id: displayHierarchy,
          text: text
        };
    };
    self.displayHierarchyDelim = '/';
    self.idDelim = '/';
    
    /**
     * Given a hierarchical id, return the ids of all parents
     * in order of nearest parent to farthest parent.
     * @param {string} childId
     * @returns {array<string>} - the ids of every parent
     */
    self.getParentIds = function(childId){
        //if present, remove trailing delim before recursion
        if(childId.last() === self.idDelim){
            var slashIndex = childId.length - 1; 
            childId = childId.slice(0, slashIndex);
        }
        
        var parentIds = [];
        
        var recursivelyGetParentIds = function(childId){
            //pull off last delim in the id and the text to the right of it
            var lastDelimIndex = childId.lastIndexOf(self.idDelim);
            //base case
            if(lastDelimIndex === -1){
                return;
            }
            else{
                var newChildId = childId.to(lastDelimIndex);
                //recursive case
                parentIds.push(newChildId); 
                recursivelyGetParentIds(newChildId);
            }
        };
        //In case the user specifies the prefix as the initial childId,
        //prevent infinite recursion.
        if(childId !== self.parentIdPrefix){
            recursivelyGetParentIds(childId);
        }
        return parentIds;
    };
    
    //construction
    timeSeriesVisualizations.each(function(timeSeriesVisualization){
        var id = timeSeriesVisualization.id;
        var displayHierarchy = getTreeDisplayHierarchy(timeSeriesVisualization.metadata);
        //add id to set of already created tree node ids
        treeNodeIds[displayHierarchy] = true;

        //create jstree node config
        mostRecentlyCreatedTreeNode = self.createLeafNode(id, displayHierarchy);
        //add to collection of node configs that jstree will instantiate
        treeNodes.push(mostRecentlyCreatedTreeNode);
        parentIds = self.getParentIds(displayHierarchy);
        parentIds.each(function(parentId){
           //set parent pointer
           mostRecentlyCreatedTreeNode.parent = parentId;
           
           //if parent has already been instantiated
           //then higher parents have already been created too
           if(Object.has(treeNodeIds, parentId)){
               //break loop
               return false;
           }
           else{
               treeNodeIds[parentId] = true;
               mostRecentlyCreatedTreeNode = self.createBranchNode(parentId, displayHierarchy);
               treeNodes.push(mostRecentlyCreatedTreeNode);
           }
        });
        //if the most recently created node lacks a parent
        if(!mostRecentlyCreatedTreeNode.parent){
            //then it was a root node, and jstree requires its parent attribute
            //be set to '#'
            mostRecentlyCreatedTreeNode.parent = 'root';
        }
    });
    
    // The order that the constituents will appear in the tree. This property represents the nodeID
    var TOP_LEVEL_SORT_ORDER = {
		'most frequently detected' : 1,
		'closest to benchmarks' : 2,
		'2nd closest to benchmarks' : 3,
		'3rd closest to benchmarks' : 4,
    };
    // The order that the graph type will appear in the nodes for a constituent
    
    var MID_AND_LOWER_LEVEL_SORT_ORDER = {
		'sample concentration' : 10,
		'herbicide sample concentration' : 20,
		'non-herbicide sample concentration' : 30,
		'human health' : 100,
		'aquatic life' : 110
    };

    $.jstree.defaults.sort = function(nodeAid, nodeBid){
		var nodeA = this.get_node(nodeAid);
		var nodeB = this.get_node(nodeBid);
		var lcaseNodeAId = nodeAid.toLowerCase();
		var lcaseNodeBId = nodeBid.toLowerCase();
		// Branches
		if (nodeA.parent === 'root')
			if (Object.has(TOP_LEVEL_SORT_ORDER, lcaseNodeAId)) {
				if (Object.has(TOP_LEVEL_SORT_ORDER, lcaseNodeBId)) {
					if (TOP_LEVEL_SORT_ORDER[lcaseNodeAId] > TOP_LEVEL_SORT_ORDER[lcaseNodeBId]) {
						return 1;
					} else {
						return -1;
					}
				}
				else {
					return 1;
				}
			}
			else if (Object.has(TOP_LEVEL_SORT_ORDER, lcaseNodeBId)) {
				return -1;
			}
			else {
				return nodeAid > nodeBid ? 1 : -1;
			}
		else {// Leafs
			var leafAid = nodeAid.from(nodeAid.lastIndexOf('/') + 1);
			var leafBid = nodeBid.from(nodeBid.lastIndexOf('/') + 1);
			
			var lcaseLeafAid = leafAid.toLowerCase();
			var lcaseLeafBid = leafBid.toLowerCase();
			if (Object.has(MID_AND_LOWER_LEVEL_SORT_ORDER, lcaseLeafAid)) {
				if (Object.has(MID_AND_LOWER_LEVEL_SORT_ORDER, lcaseLeafBid)) {
					if (MID_AND_LOWER_LEVEL_SORT_ORDER[lcaseLeafAid] > MID_AND_LOWER_LEVEL_SORT_ORDER[lcaseLeafBid]) {
						return 1;
					}
					else {
						return -1;
					}
				}
				else {
					return 1;
				}
			}
			else if (Object.has(MID_AND_LOWER_LEVEL_SORT_ORDER, lcaseLeafBid)) {
				return -1;
			}
			else {
				return leafAid > leafBid ? 1 : -1;
			}
		}
    };
    
    graphToggleElt.jstree({
        'plugins': ['checkbox', 'types', 'state', 'sort'],
        'core' : {
            'data' : treeNodes
        }
    });      
    

    
    var plotTree = $(graphToggleElt).jstree();
    var getNode = function(selectedItem){
        return plotTree.get_node(selectedItem);
    }; 
    
    var getAllLeafChildren = function(node){
        var leafChildren = [];
        var recursivelyGetAllLeafChildren = function(nodeRef){
            //recursive case
            var node = getNode(nodeRef);
            if(node.children.length){
                node.children.each(recursivelyGetAllLeafChildren);
            }
            //base case
            else {
                leafChildren.add(node);
            }
        };
        recursivelyGetAllLeafChildren(node, leafChildren);
        return leafChildren;
    };
    
    var getTimeSeriesVisualizationsForNode = function(leafNode){
        var tsvId = leafNode.original.type;
        var timeSeriesVisualization = nar.pestTimeSeries.VisualizationRegistryInstance.get(tsvId);
        return timeSeriesVisualization;
    };
    
    graphToggleElt.on("select_node.jstree", function (e, data) {
        var node = data.node;
        plotTree.open_all(node);
        var leafChildren = getAllLeafChildren(node);
        leafChildren = leafChildren.reverse();
        var timeSeriesVisualizations = leafChildren.map(getTimeSeriesVisualizationsForNode); 
        tsvController.visualizeAll(timeSeriesVisualizations);
    });
    graphToggleElt.on("deselect_node.jstree", function (e, data) {
        var leafChildren = getAllLeafChildren(data.node);
        var timeSeriesVisualizations = leafChildren.map(getTimeSeriesVisualizationsForNode);
        tsvController.removeAll(timeSeriesVisualizations);
    });
    //open root node by default
    $(graphToggleElt).jstree("open_node", "root");
    
};
var _ = require('lodash');
var tinycolor = require('tinycolor2');

function createColorVariety(tinyColor, numOfColorsNeeded, maxDifferenceToBase) {
	if (numOfColorsNeeded === 1) {
		return [tinyColor.desaturate(7).spin(Math.round((-1) * maxDifferenceToBase/3) + Math.round((5 - Math.random()*10))).lighten(Math.floor(Math.random()*6)).toString()];
	} else if (numOfColorsNeeded === 2) {
		return [tinyColor.desaturate(7).spin((-1) * Math.round(maxDifferenceToBase/2) + Math.round((3 - Math.random()*6))).toString(), tinyColor.spin(maxDifferenceToBase + Math.round((3 - Math.random()*7))).toString()];
	}

	var maxSpinDifference = maxDifferenceToBase; // Make sure is even
	var spinStep = Math.round(maxSpinDifference / numOfColorsNeeded);

	var colors = [];
	// Prepare tinycolor instance to starting value
	tinyColor.desaturate(7).spin((-1)*maxSpinDifference/2 - maxSpinDifference/4);

	for (var i = 0; i < numOfColorsNeeded; i++) {
		colors.push(tinyColor.toString());
		tinyColor.spin(spinStep);
	};
	console.warn("COLORS CREATED");
	console.log(colors);
	return colors;

}

function doColorTransform(dataTree, baseColor, settings, maxDifferenceToBase) {

	var firstLevel = dataTree; // dataTree itself is an array
	var nthLevels = []; // array of arrays

	var baseTinyColor = tinycolor(baseColor);

	var branchFactor = dataTree.length;
	var variety = createColorVariety(baseTinyColor, branchFactor, maxDifferenceToBase); // Returns array of size branchFactor
	// Apply them first

	for (var i = 0; i < branchFactor; i++) {
		var branch = dataTree[i];
		branch.color = variety.pop();
		console.log("TRANSFORM FOR: " + branch.name + "with max diff: " + maxDifferenceToBase);
		if (branch.children && branch.children.length !== 0) {
			doColorTransform(branch.children, branch.color, settings, Math.round(maxDifferenceToBase/2.9));
		}		
	};

	




	return dataTree;



}

function useAllColorScale(dataTree, baseColor, settings, randomizer) {
	console.log(dataTree);
	console.log("DATA TREE LEN: " + dataTree.length);
	var colors = tinycolor(baseColor).analogous(dataTree.length, 15);
	var branchFactor = colors.length;
	console.log("COLORS length: " + colors.length);
	for (var i = 0; i < branchFactor; i++) {
		var branch = dataTree[i];
		console.log(randomizer);
		branch.color = randomizer.randomize(tinycolor(colors.pop())).toString();
		if (branch.children && branch.children.length !== 0) {
			useAllColorScale(branch.children, branch.color, settings, randomizer);
		}				
	}

	return dataTree;



}

function useAllColorScaleToItem(branch, baseColor, settings, randomizer) {
	branch.color = baseColor;
	if (branch.children) useAllColorScale(branch.children, baseColor, settings, randomizer);

	return branch;
}



// This is stateless library helper so lets return API function
module.exports = function(dataTree, settings) {

	var defaultColors = ['#F26F15', '#2095F2', '#88EF3C', '#EF104B'];

	// Make sure settings are all right
	settings = settings || {};
	settings.childrenPropertyName = settings.childrenPropertyName || 'children';
	settings.propertyNameForColor = settings.propertyNameForColor || 'color';
	settings.colorRangeFromBase   = settings.colorRangeFromBase   || 100;
	settings.enableRandom         = settings.enableRandom || true;

	var randomizer = settings.enableRandom ? new Randomizer() : new NoRandomizer();

	if (settings.baseColor) {
		return doColorTransform(dataTree, settings.baseColor, settings, settings.colorRangeFromBase);
	} else {
		var shuffledColors = _.shuffle(defaultColors);
		if (dataTree.length === 2) {

			dataTree[0] = useAllColorScaleToItem(dataTree[0], shuffledColors[0], settings, randomizer);
			dataTree[1] = useAllColorScaleToItem(dataTree[1], shuffledColors[1], settings, randomizer);
			return dataTree;

		} else if (dataTree.length === 3) {
			dataTree[0] = useAllColorScaleToItem(dataTree[0], shuffledColors[0], settings, randomizer);
			dataTree[1] = useAllColorScaleToItem(dataTree[1], shuffledColors[1], settings, randomizer);
			dataTree[2] = useAllColorScaleToItem(dataTree[2], shuffledColors[2], settings, randomizer);
			return dataTree;			
		}
		else if (dataTree.length === 4) {
			dataTree[0] = useAllColorScaleToItem(dataTree[0], shuffledColors[0], settings, randomizer);
			dataTree[1] = useAllColorScaleToItem(dataTree[1], shuffledColors[1], settings, randomizer);
			dataTree[2] = useAllColorScaleToItem(dataTree[2], shuffledColors[2], settings, randomizer);
			dataTree[3] = useAllColorScaleToItem(dataTree[3], shuffledColors[3], settings, randomizer);
			return dataTree;			
		}		
		return useAllColorScale(dataTree, '#f00', settings, settings.colorRangeFromBase, randomizer);
	}

	

	
}

function Randomizer() {
	this.r = Math.random();
	this.s = Math.random();

	this.randomize = function(tinyColor) {
		if (this.r < 0.25) {
			tinyColor.desaturate(Math.random()*40);
		} else if (this.r < 0.5) {
			tinyColor.saturate(Math.random()*50);
		} else if (this.r < 0.75) {
			tinyColor.darken(Math.random()*24);
		} else {
			tinyColor.lighten(Math.random()*30);
		}

		if (this.s < 0.3) {
			tinyColor = tinyColor.spin(10 - Math.floor(Math.random()*20));
		}

		return tinyColor;
	}

}

function NoRandomizer() {


	this.randomize = function(tinyColor) {
		// Do nothing
		return tinyColor;
	}

}
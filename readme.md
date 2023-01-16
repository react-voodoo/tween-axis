<h1 align="center">tween-axis</h1>
<p align="center">Fast, additive, reversible, delta based, tween composition engine</p>

___

<p align="center">
<a href="https://www.npmjs.com/package/tween-axis">
<img src="https://img.shields.io/npm/v/tween-axis.svg" alt="Npm version" /></a>
<img src="https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat" />
</p>

## Description

Classic Tween engines can only output absolute values, which quickly results in very complex code when we have to
gradually compose values from multiple sources (e.g. when merging multiple animations based on user drag interactions )
.<br/>

Tween Axis is a delta-based interpolation engine that solves this problem, it allows:

- To apply forward and backward multiples tween values on same properties and multiple objects
- To do additive tweening
- Pre-generating frames of properties ( CSS, SVG properties, etc... )
- Get the delta of multiples values basing a timeline position
- Etc...

## Really basic example :

```jsx harmony
import TweenAxis from "tween-axis";

// // Add the easing function if you want them :
// import * as D3Ease from "d3-ease";
// TweenAxis.EasingFunctions = D3Ease;

let axis    = new TweenAxis(
	    [
		    {
			    from    : 0,
			    duration: 100,
			    // easeFn  : "easePolyOut", // any fn of fn id from TweenAxis.EasingFunctions ( https://github.com/d3/d3-ease format )
			    target: "myTargetId",
			    apply : {
				    value: 200
			    }
		    },
		    {
			    from    : 0,
			    duration: 100,
			    // easeFn  : "easePolyIn", // any fn of fn id from TweenAxis.EasingFunctions ( https://github.com/d3/d3-ease format )
			    target: "myTargetId",
			    apply : {
				    value: -100
			    }
		    }
	    ]
    ),
    context = {
	    myTargetId: {
		    value: 0
	    }
    };

// Use the goTo method to set position basing real axis position
console.log(axis.goTo(50, context));
// { myTargetId: { value: 50 } }
console.log(axis.goTo(25, context));
// { myTargetId: { value: 25 } }
console.log(axis.goTo(75, context));
// { myTargetId: { value: 75 } }

// use the (axis).go method to set position using position/(axis total duration) value
console.log(axis.go(.5, context));
//{ myTargetId: { value: 50 } }
console.log(axis.go(.25, context));
//{ myTargetId: { value: 25 } }
console.log(axis.go(.75, context));
//{ myTargetId: { value: 75 } }

```

### How to add custom tasks / lines

See the SVG Path sample [here](doc/customTasks/SVGPath.js) 

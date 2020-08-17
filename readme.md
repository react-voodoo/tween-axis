# tween-axis

Fast, additive, reversible, delta based, tween composition engine

- Allow to apply forward and backward multiples tweens on same properties and multiple objects
- Allow additive tweening
- Allow frame pre-generation,
- tween-axis only compose numeric tween, no css muxer is included
- Work in anywhere environment

### Really basic example :

```jsx harmony
import TweenAxis from "tween-axis";


let axis    = new TweenAxis(
        [
            {
                from    : 0,
                duration: 100,
                // easeFn  : "easePolyOut", // any fn from https://github.com/d3/d3-ease or the easing function
                target  : "myTargetId",
                apply   : {
                    value: 200
                }
            },
            {
                from    : 0,
                duration: 100,
                // easeFn  : "easePolyIn", // any fn from https://github.com/d3/d3-ease or the easing function
                target  : "myTargetId",
                apply   : {
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

### Todo :

- Optims updates
- Recycling updates
- more doc


[![*](https://www.google-analytics.com/collect?v=1&tid=UA-82058889-1&cid=555&t=event&ec=project&ea=view&dp=%2Fproject%2Ftween-axis&dt=readme)](#)
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
                target  : "myTargetId",
                apply   : {
                    value: 200
                }
            },
            {
                from    : 0,
                duration: 100,
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

### License ?

AGPL-3.0 license


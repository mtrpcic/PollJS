var Poll = {
    "version": "0.3",
    "start": function(config){
		if(typeof config === 'string')
		{
			if(Poll.exists(config, true))
			{
				config = Poll.timers[config].config;
			}
			else
			{
				throw "PollJS: The interval you are trying to re-activate does not exist.";
			}
		}
		else
		{
	        action = config.action;
	        config.internal_action = config.action;
	        config.action = function(){
	            Poll.util.attempts(config.name, config.internal_action);
	        };
	    }
	    
        if(config.start){
            if(config.interval){
                if(config.increment){
                    Poll.timers[config.name] = {"type": "timeout", "config": config, "attempts": 0, "active": true, "value": setTimeout(function(){
                        Poll.util.timeout(config.name, config.action, config.interval);
                    }, config.start)};
                } else {
                    Poll.timers[config.name] = {"type": "timeout", "config": config, "attempts": 0, "active": true, "value": setTimeout(function(){
                        config.action();
                        Poll.timers[config.name].value = setInterval(config.action, config.interval);
                        Poll.timers[config.name].type = "interval";
                    }, config.start)};
                }
            } else {
                Poll.timers[config.name] = {"type": "timeout", "config": config, "attempts": 0, "active": true, "value": setTimeout(config.action, config.start)};	
            }				
        } else if(config.interval){
            if(config.increment){
                Poll.timers[config.name] = {"type": "interval", "config": config, "attempts": 0, "active": true, "value": setTimeout(function(){
                    Poll.util.timeout(config.name, config.action, (config.interval + config.increment));
                }, config.interval)};
            } else {
                Poll.timers[config.name] = {"type": "interval", "config": config, "attempts": 0, "active": true, "value": setInterval(config.action, config.interval)};
            }
        } else {
            throw "PollJS: You need to define a start, an interval, or both.";
        }
    },
    "util": {
        "attempts": function(name, fn){
            var ret, instance = Poll.timers[name];
            Poll.timers[name].attempts += 1;
            ret = fn();

            if(ret === false){
                Poll.stop(name);
            }

            if(instance.config.attempts){
                if(instance.attempts == instance.config.attempts){
                    Poll.stop(name);
                    instance.config.fallback();				
                }
            }
        },
        "timeout": function(name, fn, start){
            var time, config = Poll.timers[name].config;
            time = (start + (config.increment || 0));
            Poll.timers[name].value = setTimeout(function(){
                Poll.util.timeout(config.name, fn, time);
            }, time);
            Poll.timers[name].type = "timeout";
            fn();
        }
    },
    "exists": function(name, ignore_active_state){
		if(Poll.timers[name] !== undefined && (ignore_active_state === true || Poll.timers[name].active === true))
		{
			return true;
		}
		else
		{
			return false;
		}
    },
	"stop": function(name){
		if(Poll.exists(name))
		{
			var instance = Poll.timers[name];
			if(instance.type == "interval"){
				clearInterval(instance.value);
				instance.active = false;
				
			} else {
				clearTimeout(instance.value);
				instance.active = false;
			}
		}
	},
	"timers":{}
};

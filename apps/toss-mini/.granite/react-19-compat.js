
    const React = require('react');
    const reactUsePolyfill = require('/Users/user/workspace/flower-map/.worktrees/toss-mini/node_modules/.pnpm/react18-use@0.4.1_react@19.2.0/node_modules/react18-use/dist/cjs/index.js');
    const reactEffectEventPolyfill = require('/Users/user/workspace/flower-map/.worktrees/toss-mini/node_modules/.pnpm/use-effect-event@2.0.3_react@19.2.0/node_modules/use-effect-event/dist/index.cjs');
  
    function useOptimisticPolyfill(passthroughState, reducer) {
      const [optimisticState, setOptimisticState] = React.useState(passthroughState);
      const lastPassthroughState = React.useRef(passthroughState);
  
      if (passthroughState !== lastPassthroughState.current) {
        setOptimisticState(passthroughState);
        lastPassthroughState.current = passthroughState;
      }
  
      function addOptimistic(action) {
        setOptimisticState((current) => reducer(current, action));
      }
  
      return [optimisticState, addOptimistic];
    }
  
    module.exports = Object.assign(React, {
      use: reactUsePolyfill.use,
      useEffectEvent: reactEffectEventPolyfill.useEffectEvent,
      useOptimistic: useOptimisticPolyfill,
    });
    
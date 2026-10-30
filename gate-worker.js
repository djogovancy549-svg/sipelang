   const APP = {
     async fetch(request, env, ctx) {
       return env.ASSETS.fetch(request);
     }
   };

/* Normalize objects created by legacy in-module demo factories through the final extension schema. */
(function(root){'use strict';const E=root.Sultan;if(!E||!E.normalizeFinalProject)return;const baseDemo=E.demo;E.demo=function(){return E.normalizeFinalProject(baseDemo());};})(globalThis);

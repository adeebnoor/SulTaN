'use strict';
const assert=require('node:assert/strict');
const E=require('../src/import.js');
globalThis.Sultan=E;
require('../src/performance.js');

const p=E.demo();
const first=E.breakEven(p);
const second=E.breakEven(p);
assert.strictEqual(second,first,'unchanged scoring inputs should reuse the cached break-even result');

p.institution.name+=' updated';
const unrelated=E.breakEven(p);
assert.strictEqual(unrelated,first,'non-scoring project edits should not invalidate break-even cache');

p.criteria[0].weight-=1;
p.criteria[1].weight+=1;
const weightChanged=E.breakEven(p);
assert.notStrictEqual(weightChanged,first,'criterion-weight changes must invalidate break-even cache');

const cachedAfterWeight=E.breakEven(p);
assert.strictEqual(cachedAfterWeight,weightChanged,'updated scoring state should then be cached');

p.options[0].scores[p.criteria[0].id].value-=1;
const scoreChanged=E.breakEven(p);
assert.notStrictEqual(scoreChanged,weightChanged,'option-score changes must invalidate break-even cache');

p.options[0].title+=' renamed';
const titleChanged=E.breakEven(p);
assert.notStrictEqual(titleChanged,scoreChanged,'display names used in break-even output must invalidate cached labels');

p.criteria[0].polarity=p.criteria[0].polarity==='cost'?'benefit':'cost';
const polarityChanged=E.breakEven(p);
assert.notStrictEqual(polarityChanged,titleChanged,'criterion-polarity changes must invalidate break-even cache');

console.log(JSON.stringify({tests:7,passed:7,cache:'pass'}));

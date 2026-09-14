'use strict';
const assert=require('node:assert/strict');
const E=require('../src/import.js');

function throwsUnknown(mutator){const p=E.demo();mutator(p);assert.throws(()=>E.validateImport(p));}

assert.doesNotThrow(()=>E.validateImport(E.demo()));
throwsUnknown(p=>{p.extra='nope';});
throwsUnknown(p=>{p.institution.extra='nope';});
throwsUnknown(p=>{p.criteria[0].extra='nope';});
throwsUnknown(p=>{p.options[0].extra='nope';});
throwsUnknown(p=>{p.options[0].scores.identity.extra='nope';});
throwsUnknown(p=>{p.references[0].extra='nope';});
throwsUnknown(p=>{p.transitions[0].extra='nope';});
throwsUnknown(p=>{p.transitions[0].annual[0].extra='nope';});
throwsUnknown(p=>{p.transitions[0].history[0].extra='nope';});
throwsUnknown(p=>{p.enablers[0].extra='nope';});
throwsUnknown(p=>{p.initiatives[0].extra='nope';});
throwsUnknown(p=>{p.initiatives[0].budget[0].extra='nope';});
throwsUnknown(p=>{p.mandates[0].extra='nope';});
throwsUnknown(p=>{p.funding[0].extra='nope';});
throwsUnknown(p=>{p.log=[{at:new Date().toISOString(),action:'x',path:'',revision:1,extra:'nope'}];});

const partial=E.demo();partial.options[0].scores.identity={value:55};
const normalized=E.validateImport(partial);
assert.equal(normalized.options[0].scores.identity.note,'');

const partial2=E.demo();partial2.options[0].scores.identity={note:'draft'};
const normalized2=E.validateImport(partial2);
assert.equal(normalized2.options[0].scores.identity.value,null);

console.log('Hardening import tests: passed');

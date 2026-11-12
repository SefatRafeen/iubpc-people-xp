import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_MEMBERS,
  pad,
  mod,
  shortest,
  generateQrPath,
  computeRingMetrics,
  computeRingBody,
  stepSpring,
  matchesMember,
  filterMembers,
} from './lookbook';

test('TOTAL_MEMBERS equals all 18 people on iubpc.org/people', () => {
  assert.equal(TOTAL_MEMBERS, 18);
});

test('pad formats 1..18 to two digits', () => {
  assert.equal(pad(1), '01');
  assert.equal(pad(9), '09');
  assert.equal(pad(18), '18');
});

test('shortest ring distance wraps around 18 members', () => {
  assert.equal(shortest(1, 0), 1);
  assert.equal(shortest(17, 0), -1);
  assert.equal(shortest(0, 17), 1);
  assert.equal(shortest(9, 0), -9);
  assert.equal(mod(-1, 18), 17);
});

test('computeRingMetrics and computeRingBody place front member at highest z-index with zero blur', () => {
  const m = computeRingMetrics(1440, 900, 1440);
  assert.equal(m.cx, 720);
  const frontBody = computeRingBody(0, 0, m);
  const backBody = computeRingBody(9, 0, m);
  assert.equal(frontBody.depth, 1);
  assert.equal(frontBody.z, 1010);
  assert.equal(frontBody.blur, 0);
  assert.ok(frontBody.s > backBody.s);
  assert.equal(backBody.z, 10);
});

test('spring settles smoothly from -1.15 to 0 without overshoot', () => {
  let pos = -1.15;
  let vel = 0;
  let settled = false;
  for (let i = 0; i < 120; i++) {
    const next = stepSpring(pos, 0, vel, 1 / 60);
    pos = next.pos;
    vel = next.vel;
    settled = next.settled;
    assert.ok(pos <= 0.001, 'critically damped spring should not overshoot');
    if (settled) break;
  }
  assert.equal(settled, true);
  assert.equal(pos, 0);
});

test('generateQrPath produces deterministic SVG path with finder patterns', () => {
  const d1 = generateQrPath();
  const d2 = generateQrPath();
  assert.equal(d1, d2);
  assert.ok(d1.startsWith('M0 0h1v1h-1z'));
});

test('matchesMember and filterMembers filter by name, role, or department', () => {
  const sample = [
    { name: 'Ikram Hossain Akif', role: 'President', dept: 'CSE · Senior', tier: 'Executive' },
    { name: 'Farhan Sadeque', role: 'Director of Public Relations', dept: 'CSC · Senior', tier: 'Executive' },
    { name: 'Ayatulla MD Khomany Semanto', role: 'Director of Events', dept: 'EEE · Senior', tier: 'Executive' },
    { name: 'Asif Mahmood, PhD', role: 'Faculty Advisor', dept: 'Faculty · CSE · IUB', tier: 'Faculty' },
  ];
  assert.equal(filterMembers(sample, '').length, 4);
  assert.equal(filterMembers(sample, 'akif').length, 1);
  assert.equal(filterMembers(sample, 'public relations').length, 1);
  assert.equal(filterMembers(sample, 'EEE').length, 1);
  assert.equal(filterMembers(sample, 'CSE').length, 2);
  assert.equal(filterMembers(sample, 'faculty advisor').length, 1);
  assert.equal( matchesMember(sample[0], 'nonexistent'), false);
});


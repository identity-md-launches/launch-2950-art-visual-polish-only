// Regression checks for the two requested pre-run pick fixes. No network or wallet.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const html = await readFile(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const functions = html.slice(html.indexOf('function pickOpen('), html.indexOf('function scoreDay('));
const date = '2026-11-04', start = Date.parse(date + 'T12:00:00Z');
let wallNow = start + 1000, serverNow = wallNow, rpm = 0;
const picks = {};
const day = { date, isToday: true, startMs: start, work: 0, distMm: 0, rounds: [] };
const S = { offsetMs: 43200000, statusAt: wallNow, status: { measurement: { freshness: 'online' } }, d: 600 };
const clk = [1], world = { days: [day] };
const context = { S, clk, world, CARD: { sprint: {} }, myPicks: () => picks, srvNow: () => serverNow, running: () => rpm, Date: class extends Date { static now() { return wallNow; } } };
const { pickFor, pickOpen } = runInNewContext(functions + ';({pickFor,pickOpen})', context);
let count = 0;
const check = (value, message) => { assert(value, message); count++; };

check(pickOpen(date), 'A fresh, resting, empty current day is open');
S.statusAt = wallNow - 29999; check(pickOpen(date), '29,999 ms old status remains fresh');
S.statusAt = wallNow - 30000; check(!pickOpen(date), '30,000 ms old status locks a current-day pick');
S.statusAt = wallNow; S.status.measurement.freshness = 'stale'; check(!pickOpen(date), 'Stale wheel measurements lock the current day');
S.status.measurement.freshness = 'online'; rpm = 1; check(!pickOpen(date), 'A running wheel locks the current day'); rpm = 0;
day.work = 1; check(!pickOpen(date), 'Settled work locks the current day'); day.work = 0;
day.distMm = 1; check(!pickOpen(date), 'Live distance locks the current day'); day.distMm = 0;
serverNow = start - 1; S.statusAt = wallNow - 30001; check(pickOpen(date), 'A future day still allows a pre-run pick'); serverNow = wallNow; S.statusAt = wallNow;
clk.length = 0; check(!pickOpen(date), 'No authoritative clock means no open hand'); clk.push(1);

day.rounds = [{ end: start + 600000, w: 0, batched: true }, { end: start + 1200000, w: 0, batched: true }, { end: start + 1800000, w: 12, batched: true }];
picks[date] = { card: 'sprint', at: start + 300000, dist: 0 };
check(!pickFor(day).late, 'Quiet batched rounds do not reject a valid pre-run pick');
picks[date].at = start + 1799999; check(!pickFor(day).late, 'A pick before the first running settlement end stays valid');
picks[date].at = start + 1800000; check(pickFor(day).late, 'The first running settlement end is an inclusive late boundary');
picks[date].at = start + 1800001; check(pickFor(day).late, 'Picks after the first running settlement end are late');
picks[date].at = start - 1; check(!pickFor(day).late, 'A pick before the wheel day remains valid');
picks[date].dist = 1; check(pickFor(day).late, 'A pick made after distance counted remains late');
picks[date].dist = 0; picks[date].at = start + 600001; day.rounds = [{ end: start + 600000, w: 0, batched: true }];
check(!pickFor(day).late, 'A quiet batch alone never establishes a late-running boundary');
delete picks[date]; check(pickFor(day) === null, 'Missing picks remain absent');
picks[date] = { card: 'not-a-card', dist: 0 }; check(pickFor(day) === null, 'Unknown cards remain invalid');
console.log(`${count} pick regression checks passed.`);

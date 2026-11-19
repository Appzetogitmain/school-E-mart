// Run: node --test src/utils/portalToken.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickPortalToken, portalFromPathname } from './portalToken.js';

const parentOnly = { token: 'PARENT', portalSessions: { parent: { token: 'PARENT' } } };
const both = {
  token: 'PARENT',
  portalSessions: { parent: { token: 'PARENT' }, school: { token: 'SCHOOL' }, teacher: { token: 'TEACHER' } },
};

test('portal is derived from the page URL (teacher is not school)', () => {
  assert.equal(portalFromPathname('/school/admin'), 'school');
  assert.equal(portalFromPathname('/school/teacher/dashboard'), 'teacher');
  assert.equal(portalFromPathname('/school/teacher'), 'teacher');
  assert.equal(portalFromPathname('/superadmin/dashboard'), 'admin');
  assert.equal(portalFromPathname('/vendor/products'), 'vendor');
  assert.equal(portalFromPathname('/user/home'), 'parent');
});

test('BUG REGRESSION: school admin teacher management routes stay in the school portal', () => {
  assert.equal(portalFromPathname('/school/teacher-approvals'), 'school');
  assert.equal(portalFromPathname('/school/teacher-assignments'), 'school');
});

test('BUG REGRESSION: school page without a school session never gets the parent token', () => {
  assert.equal(pickPortalToken(parentOnly, 'school'), null);
  assert.equal(pickPortalToken({ ...parentOnly, token: 'PARENT' }, 'school'), null);
});

test('each portal gets only its own token', () => {
  assert.equal(pickPortalToken(both, 'school'), 'SCHOOL');
  assert.equal(pickPortalToken(both, 'teacher'), 'TEACHER');
  assert.equal(pickPortalToken(both, 'parent'), 'PARENT');
  assert.equal(pickPortalToken(both, 'vendor'), null);
  assert.equal(pickPortalToken(both, 'admin'), null);
});

test('parent page never gets a school token even if the global token is school', () => {
  const s = { token: 'SCHOOL', portalSessions: { school: { token: 'SCHOOL' } } };
  assert.equal(pickPortalToken(s, 'parent'), null);
});

test('legacy storage (global token only, no portalSessions) still works for parent pages only', () => {
  assert.equal(pickPortalToken({ token: 'OLD', portalSessions: {} }, 'parent'), 'OLD');
  assert.equal(pickPortalToken({ token: 'OLD', portalSessions: {} }, 'school'), null);
});

test('empty state is safe', () => {
  assert.equal(pickPortalToken({}, 'school'), null);
  assert.equal(pickPortalToken(undefined, 'parent'), null);
});

import { roleMatchesPortal } from './portalToken.js';

test('REGRESSION: a refreshed session of another role is never adopted by a portal', () => {
  assert.equal(roleMatchesPortal('admin', 'admin'), true);
  assert.equal(roleMatchesPortal('school', 'admin'), false); // admin page, refresh cookie belongs to a school login
  assert.equal(roleMatchesPortal('parent', 'admin'), false);
  assert.equal(roleMatchesPortal('parent', 'school'), false);
  assert.equal(roleMatchesPortal('school', 'school'), true);
  assert.equal(roleMatchesPortal('teacher', 'teacher'), true);
  assert.equal(roleMatchesPortal('vendor', 'school'), false);
  assert.equal(roleMatchesPortal('parent', 'parent'), true);
  assert.equal(roleMatchesPortal('user', 'parent'), true);
  assert.equal(roleMatchesPortal(undefined, 'admin'), true);
});

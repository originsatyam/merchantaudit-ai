import test from 'node:test';
import assert from 'node:assert';
import { discoverPolicyLinks } from './crawler';

test('discoverPolicyLinks: extracts and resolves same-site policy endpoints', () => {
  const rootUrl = 'https://myshop.com';
  const markdown = `
# Welcome to MyShop
Buy our products online.
[Read our Terms of Service](/terms-and-conditions)
[Privacy Policy](https://myshop.com/policies/privacy)
[Refund and Returns Policy](/policies/refund-policy)
[Shipping Policy](/pages/shipping-delivery)
[Contact Support](/support/contact-us)
[Follow on Instagram](https://instagram.com/myshop)
[Mail us](mailto:support@myshop.com)
  `;

  const links = discoverPolicyLinks(rootUrl, markdown);

  assert.strictEqual(links.terms, 'https://myshop.com/terms-and-conditions');
  assert.strictEqual(links.privacy, 'https://myshop.com/policies/privacy');
  assert.strictEqual(links.refund, 'https://myshop.com/policies/refund-policy');
  assert.strictEqual(links.shipping, 'https://myshop.com/pages/shipping-delivery');
  assert.strictEqual(links.contact, 'https://myshop.com/support/contact-us');
});

test('discoverPolicyLinks: ignores external third-party links and mailto/tel', () => {
  const rootUrl = 'https://example-store.org';
  const markdown = `
[External Terms](https://external-firm.com/legal/terms)
[Call us](tel:+18005550199)
[Script Link](javascript:void(0))
  `;

  const links = discoverPolicyLinks(rootUrl, markdown);
  assert.strictEqual(links.terms, undefined);
  assert.strictEqual(links.privacy, undefined);
  assert.strictEqual(links.refund, undefined);
});

test('discoverPolicyLinks: allows subdomains of the same merchant', () => {
  const rootUrl = 'https://brand.com';
  const markdown = `
[Legal Terms](https://legal.brand.com/terms)
  `;

  const links = discoverPolicyLinks(rootUrl, markdown);
  assert.strictEqual(links.terms, 'https://legal.brand.com/terms');
});

import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { visit } from '@ember/test-helpers';

import PageObject, { collection, hasClass, text } from 'ember-classy-page-object';

const SimpleListPage = PageObject.extend({
  scope: '[data-test-simple-list]',
  caption: text('[data-test-simple-list-caption]'),

  items: collection({
    scope: '[data-test-simple-list-item]',
    isActive: hasClass('is-active')
  })
});

module('Acceptance | collection', function(hooks) {
  setupApplicationTest(hooks);

  test('collection works as expected', async function(assert) {
    const list = new SimpleListPage();

    await visit('/');

    assert.equal(list.caption, 'Hello, List!');
    assert.equal(list.items.objectAt(0).text, 'Foo');
    assert.deepEqual(list.items.map((i) => i.text), ['Foo', 'Bar', 'Baz']);
    assert.deepEqual(list.items.mapBy('text'), ['Foo', 'Bar', 'Baz']);

    let forEachText = [];
    list.items.forEach((i) => forEachText.push(i.text));
    assert.deepEqual(forEachText, ['Foo', 'Bar', 'Baz']);

    assert.deepEqual(list.items.findAll((i) => i.isActive || i.text === 'Foo').map((i) => i.text), ['Foo', 'Bar']);
    assert.deepEqual(list.items.findAll({ text: 'Bar', isActive: true }).map((i) => i.text), ['Bar']);
    assert.deepEqual(list.items.findAll({ text: 'Foo', isActive: true }).map((i) => i.text), []);

    assert.equal(list.items.findOne((i) => i.isActive).text, 'Bar');
    assert.equal(list.items.findOne({ text: 'Bar', isActive: true }).text, 'Bar');
    assert.throws(() => list.items.findOne({ text: 'Foo', isActive: true }), /Expected at most one result.*'findOne' query in 'items' collection.*but found 0.*using query.*isActive: true/);
    assert.throws(() => list.items.findOne((i) => i.isActive || i.text === 'Foo'), /Expected at most one result.*'findOne' query in 'items' collection.*but found 2/);
  });

  test('collections do not share instances of proxies', async function(assert) {
    let page = new PageObject({
      scope: 'foo-bar-baz',

      simpleList: SimpleListPage
    });

    // create a simple list to side-effect
    new SimpleListPage();

    await visit('/');

    assert.throws(() => {
      page.simpleList.items.objectAt(0).text
    }, /foo-bar-baz \[data-test-simple-list\] \[data-test-simple-list-item\]:eq\(0\)/);
  });

  test('Collection works with PageObject definition', async function(assert) {
    let bar = new PageObject({
      scope: '[data-test-simple-list-wrapper]',

      list: {
        scope: '[data-test-simple-list]',
        foos: collection(PageObject.extend('[data-test-simple-list-item]'))
      }
    });

    await visit('/');

    assert.equal(
      bar.list.foos.objectAt(0).isPresent,
      true,
      'Collection works with Page Object definition'
    );
  });
});

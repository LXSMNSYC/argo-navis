import RadixNode from '../../src/radix/node';

describe('RadixNode', () => {
  /**
   * isGlob
   */
  describe('#isGlob', () => {
    test('returns true when key contains glob parameter', () => {
      const node = new RadixNode<undefined>('*files');
      expect(node.isGlob).toEqual(true);
    });
    test('returns false when key contains no glob paramter', () => {
      const node = new RadixNode<undefined>('a');
      expect(node.isGlob).toEqual(false);
    });
  });

  /**
   * isNamed
   */
  describe('#isNamed', () => {
    test('returns true when key contains named parameter', () => {
      const node = new RadixNode<undefined>(':files');
      expect(node.isNamed).toEqual(true);
    });
    test('returns false when key contains no named paramter', () => {
      const node = new RadixNode<undefined>('a');
      expect(node.isNamed).toEqual(false);
    });
  });

  /**
   * isNormal
   */
  describe('#isNormal', () => {
    test('returns true when key contains no named or glob parameter', () => {
      const node = new RadixNode<undefined>('a');
      expect(node.isNormal).toEqual(true);
    });
    test('returns false when key contains named paramter', () => {
      const node = new RadixNode<undefined>(':files');
      expect(node.isNormal).toEqual(false);
    });
    test('returns false when key contains named paramter', () => {
      const node = new RadixNode<undefined>('*files');
      expect(node.isNormal).toEqual(false);
    });
  });

  /**
   * set key
   */
  describe('set key', () => {
    test('accepts change when assigned', () => {
      const node = new RadixNode<undefined>('abc');
      expect(node.key).toEqual('abc');

      node.key = 'xyz';
      expect(node.key).toEqual('xyz');
    });

    test('modifies kind when assigned', () => {
      const node = new RadixNode<undefined>('abc');
      expect(node.isNormal).toEqual(true);

      node.key = ':files';
      expect(node.isNormal).toEqual(false);
      expect(node.isNamed).toEqual(true);
    });
  });

  /**
   * Payload
   */
  describe('#payload', () => {
    test('accepts any payload values', () => {
      const node = new RadixNode('abc', 'payload');
      expect(node.payload).toBeTruthy();
      expect(node.payload).toEqual('payload');
    });

    test('makes optional to provide a payload', () => {
      const node = new RadixNode<number>('abc');
      expect(node.payload).toBeFalsy();
    });
  });

  /**
   * priority
   */
  describe('#priority', () => {
    test('calculates it based on key length', () => {
      const node = new RadixNode('abc');
      expect(node.priority).toEqual(3);
    });

    test('calculates key length until named parameter is encountered.', () => {
      const node = new RadixNode('/path/:file');
      expect(node.priority).toEqual(6);
    });

    test('calculates key length until glob parameter is encountered.', () => {
      const node = new RadixNode('/path/*file');
      expect(node.priority).toEqual(6);
    });

    test('changes when key changes', () => {
      const node = new RadixNode('a');
      expect(node.priority).toEqual(1);

      node.key = 'bc';
      expect(node.priority).toEqual(2);

      node.key = '/de/:fg';
      expect(node.priority).toEqual(4);
    });
  });

  /**
   * sort
   */
  describe('#sort', () => {
    test('orders children nodes by priority', () => {
      const root = new RadixNode('/');
      const nodes = [
        new RadixNode('a'),
        new RadixNode('bc'),
        new RadixNode('def'),
      ];

      root.children.push(...nodes);
      root.sort();

      expect(root.children[0]).toEqual(nodes[2]);
      expect(root.children[1]).toEqual(nodes[1]);
      expect(root.children[2]).toEqual(nodes[0]);
    });
  });
});

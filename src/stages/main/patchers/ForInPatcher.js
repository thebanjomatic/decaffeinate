import ForPatcher from './ForPatcher.js';
import type BlockPatcher from './BlockPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';

export default class ForInPatcher extends ForPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, keyAssignee: ?NodePatcher, valAssignee: ?NodePatcher, target: NodePatcher, step: ?NodePatcher, filter: ?NodePatcher, body: BlockPatcher) {
    super(node, context, editor, keyAssignee, valAssignee, target, filter, body);
    this.step = step;
  }

  initialize() {
    super.initialize();
    if (this.step) {
      this.step.setRequiresExpression();
    }
  }

  patchAsStatement() {
    let { valAssignee } = this;

    let valBinding = this.slice(valAssignee.contentStart, valAssignee.contentEnd);

    let indexBinding = this.getIndexBinding();

    this.target.patch();
    let targetAgain = this.target.makeRepeatable(true, 'iterable');

    this.insert(valAssignee.outerStart, '(');
    this.overwrite(
      valAssignee.outerStart,
      this.target.outerEnd,
      `${indexBinding} = 0; ${indexBinding} < ${targetAgain}.length; ${indexBinding}++`
    );

    this.insert(this.target.outerEnd, ') {');

    this.body.insertLinesAtIndex([`${valBinding} = ${targetAgain}[${indexBinding}]`], 0);
    this.body.patch({ leftBrace: false });
  }
}

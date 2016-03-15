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
    // Run for the side-effect of patching and slicing the value.
    this.getValueBinding();

    this.patchForLoopHeader();
    this.patchForLoopBody();
  }

  getValueBinding(): string {
    if (!this._valueBinding) {
      let { valAssignee } = this;
      valAssignee.patch();
      this._valueBinding = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
    }
    return this._valueBinding;
  }

  patchForLoopHeader() {
    let firstHeaderPatcher = this.valAssignee;
    let lastHeaderPatcher = this.step || this.filter || this.target;
    this.overwrite(
      firstHeaderPatcher.outerStart,
      lastHeaderPatcher.outerEnd,
      `(${this.getInitCode()}; ${this.getTestCode()}; ${this.getUpdateCode()}) {`
    );
  }

  patchForLoopBody() {
    this.body.insertLinesAtIndex([
      `${this.getValueBinding()} = ${this.getTargetReference()}[${this.getIndexBinding()}]`
    ], 0);
    this.body.patch({ leftBrace: false });
  }

  getInitCode(): string {
    let result = `${this.getIndexBinding()} = 0`;
    if (this.step && !this.step.isRepeatable()) {
      result += `, ${this.claimFreeBinding('step')} = ${this.getStep()}`;
    }
    return result;
  }

  getTestCode(): string {
    return `${this.getIndexBinding()} < ${this.getTargetReference()}.length`;
  }

  getTargetReference(): string {
    if (!this._targetReference) {
      this.target.patch();
      if (this.target.isRepeatable()) {
        this._targetReference = this.slice(this.target.contentStart, this.target.contentEnd);
      } else {
        this._targetReference = this.claimFreeBinding('iterable');
      }
    }
    return this._targetReference;
  }

  getUpdateCode(): string {
    let indexBinding = this.getIndexBinding();
    let step = this.getStep();
    if (step.number === 1) {
      return `${indexBinding}${step.negated ? '--' : '++'}`;
    } else if (step.number === null) {
      return `${indexBinding} += ${step}`;
    } else if (step.negated) {
      return `${indexBinding} -= ${step.number}`;
    } else {
      return `${indexBinding} += ${step.number}`;
    }
  }

  getStep(): Step {
    if (this._step === undefined) {
      this._step = new Step(this.step);
    }
    return this._step;
  }
}

class Step {
  negated: boolean;
  value: string;
  number: ?number;
  raw: string;

  constructor(patcher: ?NodePatcher) {
    let negated = false;
    let root = patcher;
    let apply = (patcher: NodePatcher) => {
      if (patcher.node.type === 'UnaryNegateOp') {
        negated = !negated;
        apply(patcher.expression);
      } else {
        root = patcher;
      }
    };
    if (patcher) { apply(patcher); }
    let value = root ? root.slice(root.contentStart, root.contentEnd) : '1';
    let number =
      !root ?
        1 :
      root.node.type === 'Int' || root.node.type === 'Float' ?
        root.node.data :
      null;
    this.negated = negated;
    this.value = value;
    this.number = number;
    this.raw = `${negated ? '-' : ''}${value}`;
  }

  toString(): string {
    return this.raw;
  }
}

import ForPatcher from './ForPatcher.js';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher.js';

export default class ForOfPatcher extends ForPatcher {
  patchAsStatement() {
    let bodyLinesToPrepend = [];
    let { keyAssignee } = this;

    let keyBinding = this.getIndexBinding();
    this.insert(keyAssignee.outerStart, '(');

    let { valAssignee } = this;

    if (valAssignee) {
      valAssignee.patch();
      let valAssigneeString = this.slice(valAssignee.contentStart, valAssignee.contentEnd);
      // `for (k, v of o` → `for (k of o`
      //        ^^^
      this.remove(keyAssignee.outerEnd, valAssignee.outerEnd);

      this.target.patch();
      let targetAgain = this.target.makeRepeatable(true, 'iterable');

      let valueAssignmentStatement = `${valAssigneeString} = ${targetAgain}[${keyBinding}]`;

      if (valAssignee instanceof ObjectInitialiserPatcher) {
        valueAssignmentStatement = `(${valueAssignmentStatement})`;
      }

      bodyLinesToPrepend.push(valueAssignmentStatement);
    } else {
      this.target.patch();
    }

    let relationToken = this.getRelationToken();
    // `for (k of o` → `for (k in o`
    //         ^^              ^^
    this.overwrite(relationToken.start, relationToken.end, 'in');

    // `for (k in o` → `for (k in o)`
    //                             ^
    this.insert(this.target.outerEnd, ') {');

    this.body.insertLinesAtIndex(bodyLinesToPrepend, 0);
    this.body.patch({ leftBrace: false });
  }

  patchAsExpression() {

  }

  indexBindingCandidates(): Array<string> {
    return ['key'];
  }
}

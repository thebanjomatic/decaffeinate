import ForPatcher from './ForPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher.js';

export default class ForOfPatcher extends ForPatcher {
  patchAsStatement() {
    let bodyLinesToPrepend = [];
    let { keyAssignee } = this;

    let keyBinding = this.slice(keyAssignee.contentStart, keyAssignee.contentEnd);

    // `for k of o` → `for (k of o`
    //                     ^
    this.insert(keyAssignee.outerStart, '(');
    keyAssignee.patch();

    if (!(keyAssignee instanceof IdentifierPatcher)) {
      let keyAssigneeString = keyBinding;
      keyBinding = this.claimFreeBinding('key');
      // `for ([f, s] of o` → `for (key of o`
      //       ^^^^^^               ^^^
      this.overwrite(keyAssignee.contentStart, keyAssignee.contentEnd, keyBinding);
      bodyLinesToPrepend.push(`${keyAssigneeString} = ${keyBinding}`);
    }

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

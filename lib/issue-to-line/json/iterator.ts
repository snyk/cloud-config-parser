import { tokenize, Token } from 'esprima';
import { LineLocation } from '../../types';

type Prop = string | number | undefined;

interface IteratorToken extends Token {
  loc?: any;
}

export default class JsonIterator {
  private tokens: IteratorToken[] = [];
  private i = -1;
  private currentToken: IteratorToken = {
    type: '',
    value: '',
    loc: undefined,
  };
  private done = false;
  private previousProps: Prop[] = [];
  private lastProp: Prop = undefined;

  constructor(fileContent: string) {
    this.tokens = tokenize(fileContent, {
      comment: true,
      loc: true,
    });

    if (!this.tokens.length) {
      throw new SyntaxError('unexpected end of JSON input');
    }
  }

  [Symbol.iterator]() {
    return this;
  }

  public isCurrentType(type: string) {
    if (!this.currentToken) {
      throw new SyntaxError('unexpected end of JSON input');
    }

    return (
      (this.currentToken.type === 'Punctuator'
        ? this.currentToken.value
        : this.currentToken.type) === type
    );
  }

  public isCurrentValue(value: string) {
    if (!this.currentToken) {
      throw new SyntaxError('unexpected end of JSON input');
    }

    return (
      this.currentToken.type === 'Punctuator' &&
      this.currentToken.value === value
    );
  }

  public expectType(type: string) {
    if (this.isCurrentType(type)) {
      return;
    }

    const error = new SyntaxError(`Unexpected type ${this.currentToken.type}`);
    Object.assign(error, this.currentToken.loc.start);

    throw error;
  }

  public expectValue(value: string) {
    if (this.isCurrentValue(value)) {
      return;
    }

    const error = new SyntaxError(
      `Unexpected value ${this.currentToken.value}`,
    );
    Object.assign(error, this.currentToken.loc.start);

    throw error;
  }

  public skipComments() {
    while (
      this.currentToken &&
      (this.isCurrentType('LineComment') || this.isCurrentType('BlockComment'))
    ) {
      this.next();
    }
  }

  public next() {
    if (this.done) {
      throw new SyntaxError('Unexpected EOF');
    }
    const newToken = this.tokens[++this.i];
    this.currentToken = newToken;

    if (!this.currentToken) {
      this.done = true;
    }
  }

  public current(): IteratorToken {
    return this.currentToken;
  }

  public getCurrentLocation(): LineLocation {
    return {
      line: this.currentToken ? this.currentToken.loc.start.line : 0,
      columnStart: this.currentToken ? this.currentToken.loc.start.column : 0,
      columnEnd: this.currentToken ? this.currentToken.loc.end.column : 0,
    };
  }

  //--------------- Prop Handling
  public setLastProp(prop: Prop) {
    this.lastProp = prop;
  }

  public pushLastProp() {
    this.previousProps.push(this.lastProp);
    this.lastProp = undefined;
  }

  public restoreProp() {
    this.lastProp = this.previousProps.pop();
  }

  public getLastProp(): string {
    return this.lastProp ? this.lastProp.toString() : '';
  }
}

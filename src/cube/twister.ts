import Group from "./group";
import Game from "./game";
import Holder from "./holder";

export default class Twister {
  private _queue: TwistAction[] = [];
  private _game: Game;

  constructor(game: Game) {
    this._game = game;
  }

  twist(
    exp: string,
    reverse: boolean = false,
    times: number = 1,
    fast: boolean = false
  ) {
    let list = new TwistNode(exp, reverse, times).parse();
    if (fast) {
      list.forEach(function(element) {
        let angle = -Math.PI / 2;
        if (element.reverse) {
          angle = -angle;
        }
        if (element.times) {
          angle = angle * element.times;
        }
        let part = Group.GROUPS[element.twist];
        if (part === undefined) {
          return;
        }
        part.hold(this._game);
        part.angle = angle;
        part.adjust(this._game);
      }, this);
    } else {
      list.forEach(function(element) {
        this._queue.push(element);
      }, this);
    }
  }

  update(): boolean {
    if (this._queue.length === 0 || this._game.lock) {
      return false;
    }
    let twist = this._queue.shift();
    if (undefined == twist) {
      return false;
    }
    this.start(twist);
    return true;
  }

  start(action: TwistAction, callback: Function | null = null) {
    let angle = -Math.PI / 2;
    if (action.reverse) {
      angle = -angle;
    }
    if (action.times) {
      angle = angle * action.times;
    }
    let duration = (600 * Math.abs(angle)) / Math.PI;
    let part = Group.GROUPS[action.twist];
    if (part === undefined) {
      return;
    }
    part.hold(this._game);
    this._game.tweener.tween(
      part.angle,
      part.angle + angle,
      duration,
      (value: number) => {
        part.angle = value;
      },
      () => {
        part.adjust(this._game);
        if (callback != null) {
          callback();
        }
      }
    );
  }

  match(holder: Holder): Group[] {
    let g: Group;
    let result: Group[] = [];

    var index = holder.index;
    if (holder.index === -1) {
      g = Group.GROUPS.x;
      if (g.axis.dot(holder.plane.normal) === 0) {
        result.push(g);
      }
      g = Group.GROUPS.y;
      if (g.axis.dot(holder.plane.normal) === 0) {
        result.push(g);
      }
      g = Group.GROUPS.z;
      if (g.axis.dot(holder.plane.normal) === 0) {
        result.push(g);
      }
      return result;
    }
    var x = (index % 3) - 1;
    var y = Math.floor((index % 9) / 3) - 1;
    var z = Math.floor(index / 9) - 1;
    switch (x) {
      case -1:
        g = Group.GROUPS.L;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 0:
        g = Group.GROUPS.M;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 1:
        g = Group.GROUPS.R;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      default:
        break;
    }
    switch (y) {
      case -1:
        g = Group.GROUPS.D;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 0:
        g = Group.GROUPS.E;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 1:
        g = Group.GROUPS.U;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      default:
        break;
    }
    switch (z) {
      case -1:
        g = Group.GROUPS.B;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 0:
        g = Group.GROUPS.S;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      case 1:
        g = Group.GROUPS.F;
        if (g.axis.dot(holder.plane.normal) === 0) {
          result.push(g);
        }
        break;
      default:
        break;
    }
    return result;
  }
}

export class TwistAction {
  public twist: string;
  public reverse: boolean;
  public times: number;
}

export class TwistNode {
  private _children: TwistNode[] = [];
  private _twist: TwistAction = new TwistAction();
  constructor(exp: string, reverse: boolean = false, times: number = 1) {
    let list = exp
      .replace(/[^xyzbsfdeulmr\(\)'0123456789]/gi, "")
      .match(
        /\([xyzbsfdeulmr'\d]+\)('\d*|\d*'|\d*)|[xyzbsfdeulmr]('\d*|\d*'|\d*)/gi
      );
    if (null === list) {
      return;
    }
    if (list.length == 1) {
      var values = list[0].match(/^\((\S+)\)('?)(\d*)('?)$/i);
      if (values === null) {
        values = list[0].match(/([xyzbsfdeulmr])('?)(\d*)('?)/i);
        if (null === values) {
          return;
        }
        this._twist.twist = values[1];
        if (/[XYZ]/.test(this._twist.twist)) {
          this._twist.twist = this._twist.twist.toLowerCase();
        }
        if (/[mes]/.test(this._twist.twist)) {
          this._twist.twist = this._twist.twist.toUpperCase();
        }
      } else {
        this._children.push(new TwistNode(values[1]));
      }
      this._twist.reverse = (values[2] + values[4]).length == 0 ? false : true;
      this._twist.times = values[3].length == 0 ? 1 : parseInt(values[3]);
      this._twist.reverse = this._twist.reverse !== reverse;
      this._twist.times = this._twist.times * times;
    } else {
      this._twist.twist = exp;
      this._twist.reverse = reverse;
      this._twist.times = times;
      list.forEach(function(c) {
        var t = new TwistNode(c);
        this._children.push(t);
      }, this);
    }
  }
  parse(reverse: boolean = false): TwistAction[] {
    reverse = this._twist.reverse !== reverse;
    let _result: TwistAction[] = [];
    if (0 !== this._children.length) {
      for (var i = 0; i < this._twist.times; i++) {
        for (var j = 0; j < this._children.length; j++) {
          var n;
          if (reverse) {
            n = this._children[this._children.length - j - 1];
          } else {
            n = this._children[j];
          }
          var list = n.parse(reverse);
          list.forEach(function(element) {
            _result.push(element);
          }, this);
        }
      }
    } else {
      let action = new TwistAction();
      action.twist = this._twist.twist;
      action.reverse = reverse;
      action.times = this._twist.times;
      _result.push(action);
    }
    return _result;
  }
}

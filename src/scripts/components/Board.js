import {Component, PropTypes} from "react";
import {connect} from "react-redux";
import {Grid, Tile, Overlay} from "./";
import {List, Map} from "immutable";
import {DIRECTIONS, UP, LEFT, DOWN, RIGHT} from "../constants";
import classNames from "classnames";
import _ from "lodash";

import ReactCSSTransitionGroup from "react-addons-css-transition-group";

const startTiles = 2;
const initialTouch = {x: 0, y: 0};

@connect(state => {
  return {
    board: state.board,
    dimensions: state.board.get("dimensions"),
    isActual: state.board.get("isActual"),
    win: state.board.get("win"),
    fromSaved: state.board.get("fromSaved")
  };
})
export default class Board extends Component {
  static propTypes = {
    board: PropTypes.instanceOf(Map).isRequired,
    dimensions: PropTypes.instanceOf(List).isRequired,
    isActual: PropTypes.bool.isRequired,
    win: PropTypes.bool,
    fromSaved: PropTypes.bool.isRequired
  }

  static contextTypes = {
    actions: PropTypes.object.isRequired
  }

  componentDidMount() {
    const tiles = this.refs.tiles;
    const board = this.refs.board;

    document.addEventListener("keyup", this.handleKeyUp, false);
    tiles.addEventListener("transitionend", this.onTransitionEnd, false);
    board.addEventListener("touchstart", this.handleTouchStart, false);
    board.addEventListener("touchend", this.handleTouchEnd, false);

    if (!this.props.fromSaved) {
      _.times(startTiles, () => {
        this.context.actions.newTile();
      });
    }
  }

  handleKeyUp = (e) => {
    const direction = DIRECTIONS[e.keyCode];

    if (typeof direction !== "undefined") {
      this.context.actions.moveTiles(direction);
    }
  }

  touch: initialTouch

  getTouches(touches) {
    return {
      x: touches[0].clientX,
      y: touches[0].clientY
    };
  }

  handleTouchStart = (e) => {
    this.touch = this.getTouches(e.touches);
  }

  handleTouchEnd = (e) => {
    if (!this.touch.x || !this.touch.y) return;

    const {x, y} = this.getTouches(e.changedTouches);

    const dX = this.touch.x - x;
    const dY = this.touch.y - y;

    if (Math.abs(dX) > Math.abs(dY)) {
      if (dX > 0) {
        this.context.actions.moveTiles(LEFT);
      } else {
        this.context.actions.moveTiles(RIGHT);
      }
    } else {
      if (dY > 0) {
        this.context.actions.moveTiles(UP);
      } else {
        this.context.actions.moveTiles(DOWN);
      }
    }

    this.touch = initialTouch;
  }

  called: false

  componentDidUpdate(prevProps) {
    if (!this.props.isActual && prevProps.isActual !== this.props.isActual) {
      setTimeout(() => {
        this.context.actions.actualize();
        this.called = false;

        // TODO
        //
        // Emit on updated tiles?!
        // Wait for all tiles to be rendered before actualizing them
        // or their initial position will be the actualized one
        // WORKING WITH {50] ?
      }, 50);
    }
  }

  onTransitionEnd = (e) => {
    // Don't execute on first transition but on last!!
    // TODO - wait for all transitions to end before creating new one
    if (e.propertyName === "transform") return;
    if (!this.called) {
      this.context.actions.mergeTiles();
      this.context.actions.newTile();
      this.called = true;
    }
  }

  render() {
    const {win, dimensions} = this.props;

    const merged = [];

    const tiles = this.props.board.get("grid").flatten(2);
    const tileViews = tiles.map(tile => {
      if (tile.get("merged")) {
        merged.push(tile);
      }

      return <Tile
               key={tile.get("id")}
               {...tile.toJS()}
             />;
    });

    const hasEnded = (win !== null);
    if (hasEnded) document.removeEventListener("keyup");

    const mergeViews = _.map(merged, tile => {
      const cx = classNames(
        "result",
        `cell-${tile.get("x")}-${tile.get("y")}`
      );

      return (
        <ReactCSSTransitionGroup
          key={tile.get("id")}
          transitionName="result"
          transitionAppear={true}
          transitionEnterTimeout={0}
          transitionLeaveTimeout={0}
          transitionAppearTimeout={0} >
          <div className={cx}>+{tile.get("value")}</div>
        </ReactCSSTransitionGroup>
      );
    });

    return (
      <wrapper ref="board">
        {mergeViews}
        {hasEnded && <Overlay win={win} />}
        <container ref="tiles" id="tiles">
          {tileViews}
        </container>
        <Grid size={dimensions.toJS()} />
      </wrapper>
    );
  }
}

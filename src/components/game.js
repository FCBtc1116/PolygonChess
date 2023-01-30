import React from "react";

import "../index.css";
import Board from "./board.js";
import King from "../pieces/king";
import FallenSoldierBlock from "./fallen-soldier-block.js";
import initialiseChessBoard from "../helpers/board-initialiser.js";
import { transferNFT, initialiseNetwork } from "../helpers/blockchain-network";
import { boardArray } from "../helpers/Wallet";

export default class Game extends React.Component {
  constructor() {
    super();
    this.state = {
      squares: [],
      whiteFallenSoldiers: [],
      blackFallenSoldiers: [],
      // squareArray: [
      //   ["0xbe4ddb2c85c64a1892fb909e708ef0599e5ca6a1"],
      //   ["0xdc5ff6988244ea53ed31c1dca81c8c5692ddd258"],
      //   ["0x2f47cbc5838ce0cd691ba6b06bb45fbe73cbe4ec"],
      //   ["0xdc49998a3b56e2f025d1d731acfcb1060b7ca60c"],
      //   ["0xf012a6683d1d4597604bf60f878093f157785bd5"],
      // ],
      showArray: [],
      player: 1,
      sourceSelection: -1,
      status: "",
      turn: "white",
      loading: false,
    };
  }

  async componentDidMount() {
    const initialSquares = await initialiseChessBoard();
    const initialOwner = await initialiseNetwork();
    this.state.showArray.push(initialOwner.owner);
    this.setState({ squares: initialSquares });
  }

  async handleClick(i) {
    const squares = [...this.state.squares];

    if (this.state.sourceSelection === -1) {
      if (!squares[i] || squares[i].player !== this.state.player) {
        this.setState({
          status:
            "Wrong selection. Choose player " + this.state.player + " pieces.",
        });
        if (squares[i]) {
          squares[i].style = { ...squares[i].style, backgroundColor: "" };
        }
      } else {
        squares[i].style = {
          ...squares[i].style,
          backgroundColor: "RGB(111,143,114)",
        }; // Emerald from http://omgchess.blogspot.com/2015/09/chess-board-color-schemes.html
        this.setState({
          status: "Choose destination for the selected piece",
          sourceSelection: i,
        });
      }
      return;
    }

    squares[this.state.sourceSelection].style = {
      ...squares[this.state.sourceSelection].style,
      backgroundColor: "",
    };

    if (squares[i] && squares[i].player === this.state.player) {
      this.setState({
        status: "Wrong selection. Choose valid Location again.",
        sourceSelection: -1,
      });
    } else {
      const whiteFallenSoldiers = [];
      const blackFallenSoldiers = [];
      const isDestEnemyOccupied = Boolean(squares[i]);
      const isMovePossible = squares[this.state.sourceSelection].isMovePossible(
        this.state.sourceSelection,
        i,
        isDestEnemyOccupied
      );

      if (isMovePossible) {
        // switch (squares[this.state.sourceSelection].state.name) {
        //   case "Bishop":
        //     this.state.squareArray[0].push(
        //       this.state.boardArray[Math.floor(i / 8)][i % 8]
        //     );
        //     break;
        //   case "Knight":
        //     this.state.squareArray[1].push(
        //       this.state.boardArray[Math.floor(i / 8)][i % 8]
        //     );
        //     break;
        //   case "King":
        //     this.state.squareArray[2].push(
        //       this.state.boardArray[Math.floor(i / 8)][i % 8]
        //     );
        //     break;
        //   case "Queen":
        //     this.state.squareArray[3].push(
        //       this.state.boardArray[Math.floor(i / 8)][i % 8]
        //     );
        //     break;
        //   case "Rook":
        //     this.state.squareArray[4].push(
        //       this.state.boardArray[Math.floor(i / 8)][i % 8]
        //     );
        //     break;
        // }
        this.setState({ loading: true });
        try {
          let transferResult = await transferNFT(this.state.sourceSelection, i);
          if (transferResult.type === 2) {
            this.state.showArray.push(boardArray[Math.floor(i / 8)][i % 8]);
            if (squares[i] !== null) {
              if (squares[i].player === 1) {
                whiteFallenSoldiers.push(squares[i]);
              } else {
                blackFallenSoldiers.push(squares[i]);
              }
            }

            squares[i] = squares[this.state.sourceSelection];
            squares[this.state.sourceSelection] = null;

            const isCheckMe = this.isCheckForPlayer(squares, this.state.player);

            if (isCheckMe) {
              this.setState((oldState) => ({
                status:
                  "Wrong selection. Choose valid Location again. Now you have a check!",
                sourceSelection: -1,
              }));
            } else {
              // let player = this.state.player === 1 ? 2 : 1;
              // let turn = this.state.turn === "white" ? "black" : "white";

              this.setState((oldState) => ({
                sourceSelection: -1,
                squares,
                whiteFallenSoldiers: [
                  ...oldState.whiteFallenSoldiers,
                  ...whiteFallenSoldiers,
                ],
                blackFallenSoldiers: [
                  ...oldState.blackFallenSoldiers,
                  ...blackFallenSoldiers,
                ],
                // player,
                status: "",
                // turn,
              }));
            }
          }
        } catch (error) {
          alert("Try Again");
          this.setState({ loading: false });
          console.log(error);
        }
      } else {
        this.setState({
          status: "Wrong selection. Choose valid Location again.",
          sourceSelection: -1,
        });
      }
    }
    this.setState({ loading: false });
  }

  getKingPosition(squares, player) {
    return squares.reduce(
      (acc, curr, i) =>
        acc || //King may be only one, if we had found it, returned his position
        (curr && //current squre mustn't be a null
          curr.getPlayer() === player && //we are looking for aspecial king
          curr instanceof King &&
          i), // returned position if all conditions are completed
      null
    );
  }

  isCheckForPlayer(squares, player) {
    const opponent = player === 1 ? 2 : 1;
    const playersKingPosition = this.getKingPosition(squares, player);
    const canPieceKillPlayersKing = (piece, i) =>
      piece.isMovePossible(playersKingPosition, i, squares);
    return squares.reduce(
      (acc, curr, idx) =>
        acc ||
        (curr &&
          curr.getPlayer() === opponent &&
          canPieceKillPlayersKing(curr, idx) &&
          true),
      false
    );
  }

  // changeOption(e) {
  //   switch (e.target.value) {
  //     case "Bishop":
  //       this.setState({ showArray: this.state.squareArray[0] });
  //       break;
  //     case "Knight":
  //       this.setState({ showArray: this.state.squareArray[1] });
  //       break;
  //     case "King":
  //       this.setState({ showArray: this.state.squareArray[2] });
  //       break;
  //     case "Queen":
  //       this.setState({ showArray: this.state.squareArray[3] });
  //       break;
  //     case "Rook":
  //       this.setState({ showArray: this.state.squareArray[4] });
  //       break;
  //   }
  // }

  render() {
    return (
      <div className="d-flex">
        <div className="game">
          <div className="game-board">
            {this.state.loading && <div className="loading">Processing...</div>}
            <Board
              squares={this.state.squares}
              onClick={(i) => this.handleClick(i)}
            />
          </div>
          <div className="game-info">
            <div className="game-status">{this.state.status}</div>

            <div className="fallen-soldier-block">
              {
                <FallenSoldierBlock
                  whiteFallenSoldiers={this.state.whiteFallenSoldiers}
                  blackFallenSoldiers={this.state.blackFallenSoldiers}
                />
              }
            </div>
          </div>
        </div>
        <div style={{ marginLeft: "30px" }}>
          {/* <select
                onChange={(e) => {
                  this.changeOption(e);
                }}
              >
                <option value="Bishop">Bishop</option>
                <option value="Knight">Knight</option>
                <option value="King">King</option>
                <option value="Queen">Queen</option>
                <option value="Rook">Rook</option>
              </select> */}
          {this.state.showArray.map((item, index) => {
            return (
              <div>
                <label key={item}>{item}</label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

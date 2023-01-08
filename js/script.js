const HEIGHT = 9;
const WIDTH = 9;
const BOX_SIZE = 3;

const NUMBERS = 9;
const HINTS = 33;

const CONTAINER = "sudoku-container";
// const NUMBERS_CONTAINER = "numbers-container";

Array.prototype.shuffle = function () {
  for (let i = 0; i < this.length; i++) {
    const randomIndex = random(this.length);
    [this[i], this[randomIndex]] = [this[randomIndex], this[i]];
    i++;
  }

  return this;
};

const c = (x, y) => ({ x: Number(x), y: Number(y) });

// Renders the Sudoku
class Grid {
  constructor(sudoku) {
    this.matrix = sudoku.board;
    this.render(CONTAINER);

    document
      .getElementById(CONTAINER)
      .addEventListener("invalidCell", this.handleInvalidCell);
  }

  handleClick = (e) => {
    const x = e.currentTarget.getAttribute("data-x");
    const y = e.currentTarget.getAttribute("data-y");

    this.selected = c(x, y);

    document
      .querySelectorAll(".cell.selected")
      .forEach((e) => e.classList.remove("selected"));
    document
      .querySelectorAll(`.cell[data-box="${Sudoku.box(x, y)}"]`)
      .forEach((e) => e.classList.add("selected"));
    document
      .querySelectorAll(`.cell[data-x="${x}"]`)
      .forEach((e) => e.classList.add("selected"));
    document
      .querySelectorAll(`.cell[data-y="${y}"]`)
      .forEach((e) => e.classList.add("selected"));
  };

  parseValue = (value) => {
    if (value === "0") {
      return 0;
    }

    if (value === "") {
      return 0;
    }

    if (isNaN(value)) {
      return 0;
    }

    if (Number(value) > NUMBERS) {
      return Number(value.charAt(0));
    }

    if (Number(value) < 0) {
      return 0;
    }

    return Number(value);
  };

  handleInput = (e) => {
    const span = e.target.parentElement;

    const value = this.parseValue(e.target.value);
    const x = Number(span.getAttribute("data-x"));
    const y = Number(span.getAttribute("data-y"));

    // As the value to be triggered may have changed from the input value after parsing, update input with the value
    e.target.value = value === 0 ? "" : value;

    document
      .querySelectorAll(`.cell[data-x="${x}"][data-y="${y}"]`)
      .forEach((e) => e.classList.remove("invalid"));

    const event = new CustomEvent("newValue", { detail: { value, x, y } });
    document.getElementById(CONTAINER).dispatchEvent(event);
  };

  handleInvalidCell = (e) => {
    const x = Number(e.detail.x);
    const y = Number(e.detail.y);

    document
      .querySelectorAll(`.cell[data-x="${x}"][data-y="${y}"]`)
      .forEach((e) => e.classList.add("invalid"));
  };

  isSelected = (x, y) =>
    this.selected && this.selected.x === x && this.selected.y === y;

  render = (container) => {
    let grid = "";

    this.matrix.forEach((rows, y) => {
      rows.forEach((cel, x) => {
        grid = grid.concat(`
          <span class="cell" id="cel-${x}-${y}" data-box="${Sudoku.box(
          x,
          y
        )}" data-x="${x}" data-y="${y}">
            ${
              cel
                ? cel
                : `<input max="${NUMBERS}" min="1" type="number"></input>`
            }
          </span>`);
      });
    });

    document.getElementById(container).innerHTML = grid;
    document
      .querySelectorAll(`.${CONTAINER} .cell`)
      .forEach((e) => e.addEventListener("click", this.handleClick));
    document
      .querySelectorAll("input")
      .forEach((e) => e.addEventListener("input", this.handleInput));

    if (this.selected) {
      const input = document.querySelector(
        `#cel-${this.selected.x}-${this.selected.y} input`
      );
      input && input.focus();
    }
  };
}

class SudokuIterator {
  constructor(sudoku) {
    this.x = 0;
    this.y = 0;
    this.sudoku = sudoku;
  }

  next = () => {
    if (this.y === this.sudoku.height) {
      return { done: true };
    }

    const value = {
      value: this.sudoku.get(this.x, this.y),
      x: this.x,
      y: this.y,
    };

    this.x++;

    if (this.x === this.sudoku.width) {
      this.x = 0;
      this.y++;
    }

    return { value, done: false };
  };
}

// Class representation for Sudoku board
class Sudoku {
  constructor(board) {
    this.height = HEIGHT;
    this.width = HEIGHT;
    this.board = board ? Sudoku.clone(board) : this.emptyBoard;
  }

  get cells() {
    const cells = [];

    for (let { x, y } of this) {
      cells.push(c(x, y));
    }

    return cells;
  }

  get emptyBoard() {
    return Array(this.height)
      .fill()
      .map(() => Array(this.width).fill());
  }

  get hasEmptyCells() {
    for (let { x, y } of this) {
      if (this.isEmpty(x, y)) {
        return true;
      }
    }

    return false;
  }

  get isSolved() {
    for (let { x, y } of this) {
      if (!this.isValidCel(x, y)) {
        return false;
      }
    }

    return true;
  }

  get = (x, y) => {
    this.validateCoord(x, y);

    return this.board[y][x];
  };

  set = (x, y, value) => {
    this.validateCoord(x, y);

    this.board[y][x] = value;
  };

  unset = (x, y) => {
    this.validateCoord(x, y);

    this.board[y][x] = undefined;
  };

  getRow = (y) => {
    this.validateCoord(0, y);

    return this.board[y].filter((v) => !!v);
  };

  getCol = (x) => {
    this.validateCoord(x, 0);

    const col = [];

    this.board.forEach((row) => {
      col.push(row[x]);
    });

    return col.filter((v) => !!v);
  };

  getBox = (x, y) => {
    this.validateCoord(x, y);

    const values = [];
    const startX = Math.floor(x / BOX_SIZE) * BOX_SIZE;
    const startY = Math.floor(y / BOX_SIZE) * BOX_SIZE;

    for (let i = startX; i < startX + BOX_SIZE; i++) {
      for (let j = startY; j < startY + BOX_SIZE; j++) {
        const value = this.get(i, j);
        !!value && values.push(value);
      }
    }

    return values;
  };

  isEmpty = (x, y) => !this.get(x, y);

  // Given a coord, checks if its row, col and box are valid
  isValidCel = (x, y) =>
    this.isValidCol(x) && this.isValidRow(y) && this.isValidBox(x, y);

  isValidRow = (y) => this.areValidValues(this.getRow(y));

  isValidCol = (x) => this.areValidValues(this.getCol(x));

  isValidBox = (x, y) => this.areValidValues(this.getBox(x, y));

  // Given an array of numbers, checks if there are no duplicates
  areValidValues = (values) => {
    for (let value = 1; value <= NUMBERS; value++) {
      if (values.filter((v) => v === value).length > 1) {
        return false;
      }
    }

    return true;
  };

  validateCoord = (x, y) => {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new Error(`Invalid coord: ${x}, ${y}`);
    }
  };

  // Prints Sudoku board to console
  print = () => console.log(this.toString());

  // Overrides Object's toString method
  toString() {
    const separator = "+-----+-----+-----+\n";
    let string = "";

    this.board.forEach((rows, i) => {
      if (i === 0) {
        string = string.concat(separator);
      } else if (i % 3 === 0) {
        string = string.concat(`\n${separator}`);
      } else {
        string = string.concat("\n");
      }

      rows.forEach((cel, j) => {
        if (j === 0) {
          string = string.concat("| ");
        } else if (j % 3 === 0) {
          string = string.concat(" | ");
        }

        string = string.concat(`${cel || " "}`);
      });

      string = string.concat(" |");
    });

    string = string.concat(`\n${separator}`);

    return string;
  }

  // Returns the box where a cell belongs to (from 0 to 9)
  static box = (x, y) => Math.floor(x / 3) + 3 * Math.floor(y / 3);

  // Clones a Sudoku board
  static clone = (board) => [...board.map((row) => [...row])];

  // Validates that the given board has the correct dimensions
  static validateDimensions = (board) => {
    const valid =
      board.length === HEIGHT && board.every((row) => row.length === WIDTH);

    if (!valid) {
      throw new Error("Invalid board dimensions");
    }
  };
}

Sudoku.prototype[Symbol.iterator] = function () {
  return new SudokuIterator(this);
};

class Operations {
  constructor(board) {
    this.sudoku = new Sudoku(board);
  }

  get randomCel() {
    return c(random(this.sudoku.width), random(this.sudoku.height));
  }

  get firstEmptyCel() {
    for (let { x, y } of this.sudoku) {
      if (this.sudoku.isEmpty(x, y)) {
        return c(x, y);
      }
    }

    return false;
  }

  getCandidates = (x, y) => {
    const values = [
      ...this.sudoku.getRow(y),
      ...this.sudoku.getCol(x),
      ...this.sudoku.getBox(x, y),
    ];
    const candidates = [];

    for (let value = 1; value <= NUMBERS; value++) {
      if (values.indexOf(value) === -1) {
        candidates.push(value);
      }
    }

    return candidates;
  };
}

// Given an optional board of hints, it creates and completes the Sudoku board with the solution
class Generator extends Operations {
  constructor(hints) {
    super(hints);
    this.generate();
  }

  generate = () => {
    this.hasSolution = this.solve();
  };

  solve = () => {
    const cel = this.firstEmptyCel;

    if (!cel) {
      return true;
    }

    const { x, y } = cel;

    const candidates = this.getCandidates(x, y).shuffle();

    while (candidates.length > 0) {
      const candidate = candidates.shift();
      this.sudoku.set(x, y, candidate);

      if (this.solve()) {
        return true;
      } else {
        this.sudoku.unset(x, y);
      }
    }

    return false;
  };

  toString() {
    return this.sudoku.board.map((row) => row.join("")).join("");
  }
}

// Given a board, it validates that it has a unique solution
class Validator extends Operations {
  constructor(board) {
    if (!board) {
      throw new Error("Invalid Sudoku board to validate");
    }
    super(board);
    this.validate();
  }

  validate = () => {
    const solutions = [];

    for (let { x, y } of this.sudoku) {
      if (!this.sudoku.isEmpty(x, y)) {
        continue;
      }

      const candidates = this.getCandidates(x, y).shuffle();

      while (candidates.length) {
        const candidate = candidates.shift();

        this.sudoku.set(x, y, candidate);

        const generator = new Generator(this.sudoku.board);

        if (generator.hasSolution) {
          const solution = generator.toString();

          if (solutions.indexOf(solution) > -1) {
            continue;
          }

          if (solutions.length === 0) {
            solutions.push(solution);
          } else {
            this.isValid = false;
            return;
          }
        } else {
          this.sudoku.unset(x, y);
        }
      }
    }

    this.isValid = solutions.length === 1;
  };
}

class Game {
  constructor(hints) {
    this.generator = new Generator(hints);

    if (!this.generator.hasSolution) {
      throw new Error("No solution for this sudoku");
    }

    // this.generator.sudoku.print();

    if (hints) {
      this.sudoku = new Sudoku(hints);
    } else {
      this.sudoku = new Sudoku(this.generator.sudoku.board);
      this.setHints();
    }

    this.start();
  }

  start = () => {
    new Grid(this.sudoku);

    document
      .getElementById(CONTAINER)
      .addEventListener("newValue", this.handleNewValue);
  };

  handleNewValue = (e) => {
    const { value, x, y } = e.detail;

    if (value === 0) {
      this.sudoku.unset(x, y);
      return;
    }

    this.sudoku.set(x, y, value);

    const isValid = this.sudoku.isValidCel(x, y);

    if (!isValid) {
      const event = new CustomEvent("invalidCell", { detail: { x, y } });
      document.getElementById(CONTAINER).dispatchEvent(event);
    } else {
      if (!this.sudoku.hasEmptyCells && this.sudoku.isSolved) {
        alert("You win!");
      }
    }
  };

  // Removes numbers from the board to set the hints, checking on each iteration that the board has exactly one solution
  setHints = () => {
    const start = Date.now();

    const cells = this.sudoku.cells.shuffle();
    let hints = this.sudoku.width * this.sudoku.height;

    while (hints > HINTS) {
      const { x, y } = cells.shift();

      if (this.sudoku.isEmpty(x, y)) {
        continue;
      }

      const value = this.sudoku.get(x, y);

      this.sudoku.unset(x, y);

      const { isValid } = new Validator(this.sudoku.board);

      if (isValid) {
        hints--;
        console.log(`Hint generated!`);
      } else {
        this.sudoku.set(x, y, value);
        cells.push({ x, y });
      }
    }

    const end = Date.now();

    console.log(`${hints} Hints generated in ${(end - start) / 1000} seconds.`);
  };
}

const random = (max, min = 0) => Math.floor(Math.random() * max) + min;

const testBoards = [
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [
    [1, 0, 7, 3, 2, 8, 0, 4, 0],
    [0, 0, 8, 5, 0, 6, 0, 0, 0],
    [0, 0, 0, 7, 4, 0, 0, 2, 0],
    [3, 5, 0, 6, 0, 0, 0, 8, 2],
    [0, 0, 9, 1, 0, 2, 4, 0, 0],
    [2, 4, 0, 0, 0, 9, 0, 3, 1],
    [0, 9, 0, 0, 6, 3, 0, 0, 0],
    [0, 0, 0, 9, 0, 7, 3, 0, 0],
    [0, 7, 0, 4, 1, 5, 2, 0, 6],
  ],
  [
    // no solution
    [1, 0, 7, 3, 2, 8, 0, 4, 0],
    [0, 0, 8, 5, 0, 6, 0, 0, 0],
    [0, 0, 0, 7, 4, 0, 0, 2, 0],
    [3, 5, 0, 6, 0, 0, 0, 8, 2],
    [0, 0, 9, 1, 0, 2, 4, 0, 0],
    [2, 4, 0, 0, 0, 9, 0, 3, 1],
    [0, 9, 0, 0, 6, 3, 0, 0, 0],
    [0, 0, 0, 9, 0, 7, 3, 0, 0],
    [0, 7, 0, 4, 9, 5, 2, 0, 6],
  ],
];

const game = new Game();

const documentHeight = () =>
  document.documentElement.style.setProperty(
    "--doc-height",
    `${window.innerHeight}px`
  );

window.addEventListener("resize", documentHeight);
window.addEventListener("load", documentHeight);

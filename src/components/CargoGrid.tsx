import React from "react";
import "./CargoGrid.css";

const ROWS = 8;
const COLS = 12;

export default function CargoGrid(
    {
        grid,
        containers,
        moveSource = null, // [row, col]
        moveDest = null // [row, col]
    }    
) {
    const rows = grid.length;
    const cols = grid[0].length;
    const mid = Math.floor(cols / 2); //left and right sides 

    //correct coordinates after reversing the grid 
    const vSrc = moveSource ? [rows - 1 - moveSource[0], moveSource[1]] : null;
    const vDst = moveDest ? [rows - 1 - moveDest[0], moveDest[1]] : null;


    return (
        <div>
            {/* crane park square */}
            <div>
                <div style = {{
                    width: "45px",
                    height: "45px",
                    backgroundColor: "#ffff",
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "5px"
                }}>
                    Park
                </div>
            </div>
                
            {/*this is the ship grid*/}
            <div
                className="cargo-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 45px)`,
                }}

            >
                {[...grid].reverse().map((row,r) =>
                    row.map((cell,c) => {
                        let bg = "#ffffff";
                        let border = c < mid ? "2px solid black" : "2px solid blue";
                        let text = "";

                        //NAN blacked out 
                        if (cell === 0) {
                            bg = "black";
                        }
                        //UNUSED
                        if (cell === 1) {
                            bg = "white";
                        }

                        //container
                        if (cell > 1) {
                            const info = containers[cell];
                            text = info?.name || "";
                            bg = "#FFF5CC"; 
                        }
                        //red and green source and destination 
                        if (vSrc && vSrc[0] === r && vSrc[1] === c) {
                            bg = "green";
                            //text = "FROM";
                        }
                        if (vDst && vDst[0] === r && vDst[1] === c) {
                            bg = "red";
                            //text = "TO";
                        }

                        return (
                            <div
                                key={`${r}-${c}`}
                                className = "cell"
                                style={{
                                    width: "45px",
                                    height: "45px",
                                    border,
                                    backgroundColor: bg,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "10px",
                                    color: "black",
                                    fontWeight: 
                                        (vSrc && vSrc[0] === r && vSrc[1] === c) ||
                                        (vDst && vDst[0] === r && vDst[1] === c)
                                            ? "bold": "normal"
                                }}
                            >
                                {text}
                            </div>
                        );
                    })
                    )}
            </div>
        </div>
    );

    // return (
    //     <div className="grid-container">
    //         {Array.from({ length: ROWS }).map((_, rowIndex) => 
    //             Array.from({ length: COLS }).map((_, colIndex) => (
    //                 <div key={`${rowIndex}-${colIndex}`} className="cell"></div>
    //             ))
    //         )}
    //     </div>
    // );
}

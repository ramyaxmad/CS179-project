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
            {/*column numbers */}
            <div style={{
                display: "grid",
                gridTemplateColumns: `60px repeat(${cols}, 60px)`,
                marginBottom: "5px",
                fontWeight: "bold",
                textAlign: "center"
            }}>
                 <div></div>
                {Array.from({length: cols}, (_,i) => (
                    <div key = {i}> {i+1}</div>
                ))}
            </div>


            <div style={{display: "flex", flexDirection:"row"}}>
                {/*row numbers */}
                    <div style = {{
                        display: "grid",
                        gridTemplateRows: `repeat(${rows}, 60px)`
                    }}>
                    
                        {Array.from({length: rows}, (_,i) => (
                            <div 
                                key={i}
                                style ={{
                                    height: "60px",
                                    display: "flex",
                                    alignItems: "center",
                                    width: "60px",
                                    fontWeight: "bold"
                                }}>
                                {rows-i}
                            </div>
                        ))}
                    </div>
                

            {/*this is the ship grid*/}
            <div
                className="cargo-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 60px)`,
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
                        //if the cell is (7,0), label it PARK
                        if (r === 0 && c === 0) {
                            text = "PARK";
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
                                    width: "60px",
                                    height: "60px",
                                    border,
                                    backgroundColor: bg,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: "15px",
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
        </div>
    );

}

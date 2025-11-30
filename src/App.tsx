import Message from './Message';
import React, { useEffect } from "react";
import { useState } from "react"; 
import CargoGrid from "./components/CargoGrid";

interface BackendResult {
  initial_state: number[][];
  states: number[][][];
  steps: [number,number][];
  containers: { index: number; name:string; weight:number }[];
  moves: number;
  minutes: number;
}

function buildMoveList(eachStep: [number,number][]) {
  const moves: {from: [number, number], to: [number,number] }[] = [];

  for (let i = 0; i < eachStep.length - 1; i++) {
    moves.push({
      from: eachStep[i], to: eachStep[i+1]
    });
  }
  return moves;
}

function buildGridStates(states: number[][][], moves: any[]) {
  const ui: {grid: number[][], from: [number, number], to: [number, number]}[] = [];

  for (let i = 0; i < moves.length; i++) {
    const stateIndex = Math.floor(i / 2);
    const grid = states[stateIndex];
    ui.push({
      grid, from: moves[i].from, to: moves[i].to
    });
  }
  return ui;
}

function App() {
  const [screen, setScreen] = useState<"upload" | "loading" | "summary" | "step" | "done">("upload");
  const [data, setData] = useState<BackendResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [moves, setMoves] = useState<
    {from: [number, number]; to: [number, number]}[]
  >([]);
  const [uiStates, setUIStates] = useState<any[]>([]);


  useEffect(() => {

    // HANDLE ENTER KEY TO SWITCH TO DIFFERENT SCREENS 
    function onEnter(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      
      if (screen === "summary") {
        if (moves.length === 0) {
          setScreen("done");
          return;
        }
        setStepIndex(0);
        setScreen("step");
        return;
      }

      if (screen === "step") {
        setStepIndex(prev => {
          if (prev + 1 >= uiStates.length) {
            setScreen("done");
            return prev;
          }
          return prev + 1;
        });
        return;
      }

      if (screen === "done") {
        setData(null);
        setMoves([]);
        setUIStates([]);
        setStepIndex(0);
        setScreen("upload");
        return;
      }
    }

    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [screen, uiStates.length]);


  async function uploadManifest(file: File) {
  try {
    setScreen("loading");
    setFileName(file.name.replace(".txt", ""));

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/solve", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Backend returned error:", text);
      alert(`Backend error ${res.status}: ${text}`);
      setScreen("upload");
      return;
    }

    const result = await res.json();
    console.log("Parsed backend JSON:", result);

    setData(result);
    const builtMoves = buildMoveList(result.steps);
    const ui = buildGridStates(result.states, builtMoves);

    setMoves(builtMoves);
    setUIStates(ui);
    setScreen("summary");

  } catch (err) {
    console.error("JSON parsing failed:", err);
    alert("Could not reach backend. Is uvicorn running on http://localhost:8000?");
    setScreen("upload");
  }
}

  // computer the moveSource and moveDest 
  // take the coordinate list and show source/dest for the state after the move 

  function getMoveData() {
    if (moves.length === 0) return {moveSource: null, moveDest: null};
    if (stepIndex >= moves.length) return {moveSource: null, moveDest: null};

    return {
      moveSource: moves[stepIndex].from,
      moveDest: moves[stepIndex].to
    };
  }

  const { moveSource, moveDest } = getMoveData();

  // RENDERING BASED ON SCREEN STATE
  return (
    <div style={{padding: "30px", fontFamily: "Arial"}}>
      {/* UPLOAD manifest */}
      {screen === "upload" && (
        <>
          <h1>Mr. Keogh's Ship Balancing</h1>
          <h2>Enter a manifest</h2>
          <input
            type="file"
            accept=".txt"
            onChange={(e) => e.target.files && uploadManifest(e.target.files[0])}
          />
        </>
      )}

      {/* LOADING */}
      {screen === "loading" && (
        <>
          <h2>Computing solution...</h2>
        </>
      )}

      {/* SUMMARY */}
      {screen === "summary" && data && (
        <>
          <h2>Solution has been found!</h2>
          <p>{fileName} has {data.containers.length - 2} containers</p>
          <p>{data.moves} moves</p>
          <p>{data.minutes} minutes</p>
          <p>Hit ENTER when ready for first move</p>

          <CargoGrid grid = {data.initial_state} containers={data.containers} />
        </>
      )}

      {/* STEP THROUGH THE MOVES */}
      {screen === "step" && data && (
        <>
          <h2>Move {stepIndex + 1} of {uiStates.length}:</h2> {/*changed moves.length to  */}

          {/* show the grid with moveSource and moveDest */}
          {moveSource && moveDest && (
            <p style={{fontSize: "20px"}}>
              <span style = {{fontWeight: "bold"}}> 
                {stepIndex + 1} of {moves.length}:
              </span>
              {" "}
              Move from [{moveSource[0]}, {moveSource[1]} to {moveDest[0]}, {moveDest[1]}]
            </p>
          )
          }
          <p>Hit ENTER when done</p>
          {screen === "step" && uiStates[stepIndex] && (
            <CargoGrid
              containers={data.containers}
              grid={uiStates[stepIndex].grid}
              moveSource={uiStates[stepIndex].from}
              moveDest={uiStates[stepIndex].to}
            />
          )}
        </>
      )}

      {/* DONE SCREEN*/}
      {screen === "done" && (
        <>
          <h2>I have written an updated manifest to the desktop as {fileName}OUTBOUND.txt</h2>
          <p>Don't forget to email it to the captain.</p>
          <p>Hit ENTER when done</p>
        </>
      )}
    </div>
  );

}

export default App;


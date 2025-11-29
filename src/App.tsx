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

function App() {
  const [screen, setScreen] = useState<"upload" | "loading" | "summary" | "step" | "done">("upload");
  const [data, setData] = useState<BackendResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {

    // HANDLE ENTER KEY TO SWITCH TO DIFFERENT SCREENS 
    function onEnter(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      
      if (screen === "summary") {
        if (data && data.moves === 0) {
          setScreen("done");
        } else {
          setStepIndex(0);
          setScreen("step");
        }
      } else if (screen === "step") {
        if (!data) return;

        if (stepIndex < data.states.length - 1) {
          setStepIndex(stepIndex + 1);
        } else {
          setScreen("done");
        }
      } else if (screen === "done") {
        //restart back to upload 
        setData(null);
        setStepIndex(0);
        setScreen("upload");
      }
    }

    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [screen, stepIndex, data]);

  // UPLOAD AND CALL THE BACKEND 
  // async function uploadManifest(file: File) {
  //   setScreen("loading");
    
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   const res = await fetch("http://localhost:8000/solve", {
  //     method: "POST",
  //     body: formData,
  //   });

  //   const result = (await res.json()) as BackendResult;
  //   setData(result);
  //   setScreen("summary");
  // }

  async function uploadManifest(file: File) {
  try {
    setScreen("loading");

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
    setScreen("summary");

  } catch (err) {
    console.error("JSON parsing failed:", err);
    alert("Could not reach backend. Is uvicorn running on http://localhost:8000?");
    setScreen("upload");
  }
}


//   async function uploadManifest(file: File) {
//   try {
//     setScreen("loading");

//     const formData = new FormData();
//     formData.append("file", file);

//     const res = await fetch("http://localhost:8000/solve", {
//       method: "POST",
//       body: formData,
//     });

//     if (!res.ok) {
//       const text = await res.text();
//       console.error("Backend error:", res.status, text);
//       alert(`Backend error ${res.status}: ${text}`);
//       setScreen("upload");
//       return;
//     }

//     const result = (await res.json()) as BackendResult;
//     console.log("Backend result:", result);

//     setData(result);
//     setScreen("summary");
//   } catch (err) {
//     console.error("Fetch failed:", err);
//     alert("Could not reach backend. Is uvicorn running on http://localhost:8000?");
//     setScreen("upload");
//   }
// }


  // computer the moveSource and moveDest 
  // take the coordinate list and show source/dest for the state after the move 

  function getMoveData() {
    if (!data) return { moveSource: null, moveDest: null };

    //no color on first grid 
    if (stepIndex === 0) return { moveSource: null, moveDest: null };

    //each move uses 2 entries [from, to]
    //stateIndex = moveIndex + 1
    const moveIndex = stepIndex - 1;
    const moveSource = data.steps[moveIndex * 2] || null;
    const moveDest = data.steps[moveIndex * 2 + 1] || null;

    return { moveSource, moveDest };
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
          <p>___ has {data.containers.length - 2} containers</p>
          <p>{data.moves} moves</p>
          <p>{data.minutes} minutes</p>
          <p>Hit ENTER when ready for first move</p>

          <CargoGrid grid = {data.initial_state} containers={data.containers} />
        </>
      )}

      {/* STEP THROUGH THE MOVES */}
      {screen === "step" && data && (
        <>
          <h2>Move {stepIndex} of {data.states.length - 1}:</h2>

          {/* show the grid with moveSource and moveDest */}
          {moveSource && moveDest && (
            <>
              <p style={{fontsize: "18px"}}>
                <span style={{color: "black"}}>
                  {stepIndex} of {data.states.length - 1}:
                </span>
                {" "}
                <span style={{color: "red"}}>Move from {`[${moveSource[0]}, ${moveSource[1]}]`}</span>
                {" "}
                <span style={{color: "green"}}>to {`[${moveDest[0]}, ${moveDest[1]}]`} </span>
              </p>
            </>
          )
          }

          <CargoGrid
            grid = {data.states[stepIndex]}
            containers={data.containers}
            moveSource={moveSource}
            moveDest={moveDest}
          />
          <p>Hit ENTER when done</p>
        </>
      )}

      {/* DONE SCREEN*/}
      {screen === "done" && (
        <>
          <h2>I have written an updated manifest to the desktop as ___.txt</h2>
          <p>Don't forget to email it to the captain.</p>
          <p>Hit ENTER when done</p>
        </>
      )}
    </div>
  );

}

export default App;


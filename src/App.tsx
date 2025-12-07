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
  minutes_per_move: number[];
  outbound_text: string;
}

function buildMoveList(eachStep: [number,number][]) {
  const moves: {from: [number, number], to: [number,number] }[] = [];

  for (let i = 0; i < eachStep.length - 1; i++) {
    const same = eachStep[i][0] === eachStep[i+1][0] && eachStep[i][1] === eachStep[i+1][1];
    const park = eachStep[i][0] === 7 && eachStep[i][1] === 0;

    if (same && park) {
      continue;
    }
    moves.push({
      from: eachStep[i], to: eachStep[i+1]
    });
  }
  return moves;
}

  function NoteBox({noteText, setNoteText, saveNote}: 
    {noteText: string; setNoteText: (t:string) => void; saveNote:() =>void;}) { //func needs to be capital as component
    return (
      <div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          cols = {50}
          placeholder='Enter a note'
          style={{padding: "10px"}}/>
        <br/>
        <button
          onClick={saveNote}
          style={{marginTop: "8px", padding: "6px 6px"}}>
          SAVE
        </button>
      </div>
    );
  }

  function SaveLogEntry({logEntries, newEntry, setLogEntries}:
    {logEntries: string; newEntry: string; setLogEntries:((prev: any) => any[]);}) {
    const curr = new Date();
    const time = logFileTimestamp(curr);

    const eachLog = [...logEntries, `${time} ${newEntry}`];
    setLogEntries(prev => [...prev, `${eachLog}`]);
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

//functions to create the timestamp for the logfilename and log file content 
function logFileName(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${day}_${year}_${hour}${min}`;
}
function logFileTimestamp(date: Date){
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${month} ${day} ${year}: ${hour}:${min}`;
}

function App() {
  const [screen, setScreen] = useState<"power"| "upload" | "loading" | "summary" | "step" | "done">("power");
  const [data, setData] = useState<BackendResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [moves, setMoves] = useState<
    {from: [number, number]; to: [number, number]}[]
  >([]);
  const [uiStates, setUIStates] = useState<any[]>([]);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [logStartTimestap, setLogStartTimestap] = useState<string>("");
  const [noteText, setNoteText] = useState("");

  const pad = (n) => String(n).padStart(2,"0");
  const park = (row,col) => row === 8 && col === 1;
  
  function saveNote() {
      if (noteText.trim() === "") return;
      const curr = new Date();
      const time = logFileTimestamp(curr);
      setLogEntries(prev => [...prev, `${time} ${noteText}`]);
      setNoteText("");
  }
  
  //ENTER KEY
  useEffect(() => {

    // HANDLE ENTER KEY TO SWITCH TO DIFFERENT SCREENS 
    function onEnter(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      
      //on button page 
      if (screen === "power") {
        setScreen("upload");
        return;
      }
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
        setScreen("upload"); //goes to upload on enter
        return;
      }
    }

    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [screen, uiStates.length]);

  useEffect(() => {
    if (screen !== "step") return;
    if (!data) return;
    if (stepIndex >= uiStates.length || stepIndex < 0) return;
    const coord = uiStates[stepIndex];

        const fromCoord = park(coord.from[0] + 1, coord.from[1] + 1)
          ? "Park"
          : `[${pad(coord.from[0] + 1)}, ${pad(coord.from[1] + 1)}] `;

        const toCoord = park(coord.to[0] + 1, coord.to[1] + 1)
          ? "Park"
          : `[${pad(coord.to[0] + 1)}, ${pad(coord.to[1] + 1)}] `;
        //log each move completion
        const curr = new Date();
        const time = logFileTimestamp(curr);
        const minutesPerMove = data.minutes_per_move[stepIndex];
        setLogEntries(prev => [...prev, `${time} 
          Move ${stepIndex + 1} of ${uiStates.length}: Move from ${fromCoord} to ${toCoord}, ${minutesPerMove} minutes`]);
  }, [stepIndex, screen]);

  //DOWNLOAD OUTBOUND
  useEffect(() => {
    if (screen === "done" && data?.outbound_text) {
      //log when the outbound file is downloaded
      const curr = new Date();
      const time = logFileTimestamp(curr);
      setLogEntries(prev => [...prev, `${time} 
        Finished a Cycle. Manifest ${fileName}OUTBOUND.txt was written to downloads folder,
        and a reminder pop-up to operator to send file was displayed.`]);

      const file = new Blob([data.outbound_text], {type: "text/plain"});
      const url = URL.createObjectURL(file);

      const download = document.createElement("a");
      download.href = url;
      download.download = `${fileName}OUTBOUND.txt`;
      download.click();

      URL.revokeObjectURL(url);
    }
  }, [screen, data, fileName]);

  //ERROR HANDLING FOR FILE INPUT
  async function validateFile(file: File): Promise<boolean>{
    //check if the file is a txt file
    if (!file.name.endsWith(".txt")) {
      alert("Error: File must be a .txt manifest file");
      return false;
    }

    const text = await file.text();
    const rows = text.trim().split("\n");

    //check if file contains 96 rows
    if (rows.length !== 96) {
      alert("Error: Manifest must contain 96 lines exactly.")
      return false;
    }

    // const rowFormat = /^\[\d{2},\d{2}\], \{\d{5}\}, .+$/;
    // //check if the rows are in the correct format 
    // for (let i = 0; i < rows.length; i++) {
    //   const line = rows[i].trim();
    //   if (!rowFormat.test(line)) {
    //     alert("Error: File contains row(s) with invalid format");
    //     return false;
    //   }
    // }
    return true;
  }

  async function uploadManifest(file: File) {
  try {

    //file error handling 
    const isValid = await validateFile(file);
    if (!isValid) {
      setScreen("upload");
      return;
    }

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
    
    //log when the solution is found 
    const currTime = new Date();
    const logTime = logFileTimestamp(currTime);
    setLogEntries(prev => [...prev, `${logTime} 
      Balance solution found, it will require ${result.moves}
       moves over ${result.minutes} minutes.`]);

    const ui = buildGridStates(result.states, builtMoves);

    setMoves(builtMoves);
    setUIStates(ui);

    //logging when a file is uploaded 
    const curr = new Date();
    const time = logFileTimestamp(curr);
    setLogEntries(prev => [...prev, `${time} 
      Manifest ${file.name} is opened, there are  
      ${result.containers.length - 2} containers on the ship.`]);

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
      {/*POWER ON PAGE */}
      {screen === "power" && (
        <>
          <h1>Ship Balancing: Click START button</h1>
          <button style={{padding:"12px 25px", fontSize:"20px"}}
                  onClick={() => {
                    const curr = new Date();
                    const logtime = logFileTimestamp(curr);
                    const logfile = logFileName(curr);

                    setLogEntries([`${logtime} Program was started.`])
                    setLogStartTimestap(logfile);
                    setScreen("upload")}}>
            START
          </button>
        </>
      )}
      
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
          <p></p>
          <NoteBox 
            noteText={noteText}
            setNoteText={setNoteText}
            saveNote={saveNote}/>
        </>
      )}

      {/* SUMMARY */}
      {screen === "summary" && data && (
        <>
          <h2>Solution has been found!</h2>
          <p>{fileName} has {data.containers.length - 2} containers</p>
          <p>{data.moves + 1} moves</p>
          <p>{data.minutes} minutes</p>
          <p>Hit ENTER when ready for first move</p>
          
          {/* <SaveLogEntry
            logEntries = {logEntries}
            newEntry={newEntry}
            setLogEntries={setLogEntries}/> */}
          <NoteBox 
            noteText={noteText}
            setNoteText={setNoteText}
            saveNote={saveNote}/>
          <CargoGrid grid = {data.initial_state} containers={data.containers} />
        </>
      )}

      {/* STEP THROUGH THE MOVES */}
      {screen === "step" && data && uiStates.length > 0 && (
        <>
          <h2>Move {stepIndex + 1} of {uiStates.length}:</h2> {/*changed moves.length to  */}

          <div style = {{marginBottom: "20px"}}>
            {uiStates.slice(0,stepIndex+1).map((m, i) => (
              <div key={i}>
                <b>
                  {i+1} of {uiStates.length}:
                </b>
                {" "}
                <span style = {{fontSize: "24px"}}>
                  Move from {park(m.from[0] + 1, m.from[1]+1)
                  ? "Park"
                  : `[${pad(m.from[0] + 1)}, ${pad(m.from[1] + 1)}] `}

                {" "}to {" "}
                  {park(m.to[0] + 1, m.to[1]+1)
                  ? "Park"
                  : `[${pad(m.to[0] + 1)}, ${pad(m.to[1] + 1)}]`}

                
                </span>

              </div>
            ))}
          </div>


          <p>Hit ENTER when done</p>
          <NoteBox 
            noteText={noteText}
            setNoteText={setNoteText}
            saveNote={saveNote}/>
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
          <h2>I have written an updated manifest to the downloads folder as {fileName}OUTBOUND.txt</h2>
          <p>Don't forget to email it to the captain.</p>
          <p>Hit ENTER to input another file, or click off to end the program.</p>
          <NoteBox 
            noteText={noteText}
            setNoteText={setNoteText}
            saveNote={saveNote}/>
          
          <button
            onClick={() => {
              const curr = new Date();
              const time = logFileTimestamp(curr);

              const finalLog = [...logEntries, `${time} Program was shut down`];
              const logText = finalLog.join("\n");
              const file = new Blob([logText], {type: "text/plain"});
              const url = URL.createObjectURL(file);
              const download = document.createElement("a");
              download.href = url;
              download.download = `KeoghsPort${logStartTimestap}.txt`;
              download.click();

              URL.revokeObjectURL(url);

              //click off so go back to ON/power page
              setData(null);
              setMoves([]);
              setUIStates([]);
              setStepIndex(0);
              setLogStartTimestap("");
              setScreen("power"); //goes to upload on enter
            }}
            style={{
              marginTop: "20px",
              padding: "10px 25px",
              fontSize: "18px"
            }}>
            END PROGRAM
          </button>
        </>
      )}
    </div>
  );

}

export default App;
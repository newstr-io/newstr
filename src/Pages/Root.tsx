import "./Root.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { RootState } from "State/Store";
import { NoteCreator } from "Element/NoteCreator";
import Timeline from "Element/Timeline";
import { HexKey } from "Nostr";
import { TimelineSubject } from "Feed/TimelineFeed";

const RootTab = {
    Posts: 0,
    PostsAndReplies: 1,
    Global: 2
};

export default function RootPage() {
    const [show, setShow] = useState(false)
    const [loggedOut, pubKey, follows] = useSelector<RootState, [boolean | undefined, HexKey | undefined, HexKey[]]>(s => [s.login.loggedOut, s.login.publicKey, s.login.follows]);
    const [tab, setTab] = useState(RootTab.Posts);

    function followHints() {
        if (follows?.length === 0 && pubKey && tab !== RootTab.Global) {
            return <>
                Hmm nothing here.. Checkout <Link to={"/new"}>New users page</Link> to follow some recommended nostrich's!
            </>
        } 
    }

    const isGlobal = tab === RootTab.Global;
    const timelineSubect: TimelineSubject = isGlobal ? { type: "global", items: [] } : loggedOut ? { type: "pubkey", items: [
       "f1440f5f94651828133f5f8f307efc2eb6053f218b546bd924595beb67c1ab9f",
       "6f1658f90a18b042655c381e79ef673f91888128766a6f95f41db42a3de84db6",
       "e8e29fa47853423a4a200b8df67d8aacf032ec6f58082ae64ae161de154ebe1c",
       "b02d7008b8467c5aa79a9fdca72b4dd66b8a9954a088783850a4615d9b132d29",
       "ea5b87bc06113efdd22b3881b1f0ef44ee82b651eadb21c6c9807010ed9e68aa",
       "c22ab8fd0cedcdac7e491de3401964eeb6962becf5c3b65760e3ea3009416023",
       "56e265a2b2e54584afd054419724b539155ba71d4ce236c26fffc7c8e4c1474a",

    ]} : { type: "pubkey", items: follows };
    return (
        <>
            {pubKey ? <>
                <div className="tabs">
                    <div className={`tab f-1 ${tab === RootTab.Posts ? "active" : ""}`} onClick={() => setTab(RootTab.Posts)}>
                        Posts
                    </div>
                    <div className={`tab f-1 ${tab === RootTab.PostsAndReplies ? "active" : ""}`} onClick={() => setTab(RootTab.PostsAndReplies)}>
                        Conversations
                    </div>
                    <div className={`tab f-1 ${tab === RootTab.Global ? "active" : ""}`} onClick={() => setTab(RootTab.Global)}>
                        Global
                    </div>
                </div></> : null}
            {followHints()}
            <Timeline key={tab} subject={timelineSubect} postsOnly={tab === RootTab.Posts} method={"TIME_RANGE"} />
            {pubKey ? <NoteCreator autoFocus={show} show={show} setShow={setShow} /> : null}
        </>
    );
}

import "./Timeline.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import useTimelineFeed, { TimelineSubject } from "Feed/TimelineFeed";
import useRelayState from "Feed/RelayState";
import { HexKey, TaggedRawEvent } from "Nostr";
import EventKind from "Nostr/EventKind";
import LoadMore from "Element/LoadMore";
import Note from "Element/Note";
import NoteReaction from "Element/NoteReaction";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faForward } from "@fortawesome/free-solid-svg-icons";
import ProfilePreview from "./ProfilePreview";
import { useSelector } from "react-redux";
import { RootState } from "State/Store";
import { RelaySettings } from "Nostr/Connection";
import { System } from "Nostr/System";
import ZapButton from "./ZapButton";
import { hexToBech32 } from "Util";

export interface TimelineProps {
    postsOnly: boolean,
    subject: TimelineSubject,
    method: "TIME_RANGE" | "LIMIT_UNTIL"
}

/**
 * A list of notes by pubkeys
 */
export default function Timeline({ subject, postsOnly = false, method }: TimelineProps) {
    const { main, related, latest, parent, loadMore, showLatest } = useTimelineFeed(subject, {
        method
    });

    const [paymentRelays, setPaymentRelays] = useState<Array<{
        address: string,
        description?: string,
        lnurlp?: string,
        authed?: boolean,
    }>>(new Array())

    const relays = useSelector<RootState, Record<string, RelaySettings>>(s => s.login.relays);
    const pubKey = useSelector<RootState, HexKey| undefined>(s => s.login.publicKey);
    useMemo(() => {
        for (let [k, v] of Object.entries(relays)) {
            const c = System.Sockets.get(k);
            if(c?.Authed !== true && c?.Info && c.Info.payment) {
                const newVals = [
                    ...paymentRelays,
                    {
                        address: k,
                        ...c.Info.payment,
                    }
                ]
                setPaymentRelays([
                    ...new Map(newVals.map(v => [v.address, v])).values()
                ])
            } else if(c?.Authed === true) {
                setPaymentRelays(paymentRelays.filter(v => v.address !== k))
            }
        }
    },[relays])



    const filterPosts = useCallback((nts: TaggedRawEvent[]) => {
        return [...nts].sort((a, b) => b.created_at - a.created_at)?.filter(a => postsOnly ? !a.tags.some(b => b[0] === "e") : true);
    }, [postsOnly]);

    const mainFeed = useMemo(() => {
        return filterPosts(main.notes);
    }, [main, filterPosts]);

    const latestFeed = useMemo(() => {
        return filterPosts(latest.notes).filter(a => !mainFeed.some(b => b.id === a.id));
    }, [latest, mainFeed, filterPosts]);

    function eventElement(e: TaggedRawEvent) {
        switch (e.kind) {
            case EventKind.SetMetadata: {
                return <ProfilePreview pubkey={e.pubkey} className="card"/>
            }
            case EventKind.TextNote: {
                return <Note key={e.id} data={e} related={related.notes} />
            }
            case EventKind.Reaction:
            case EventKind.Repost: {
                let eRef = e.tags.find(a => a[0] === "e")?.at(1);
                return <NoteReaction data={e} key={e.id} root={parent.notes.find(a => a.id === eRef)}/>
            }
        }
    }
    return (
        <div className="main-content">
            {paymentRelays && paymentRelays.map(r => PaymentRelay(r.address, r.description, r.lnurlp, hexToBech32("npub", pubKey ?? '')))}
            {latestFeed.length > 1 && (<div className="card latest-notes pointer" onClick={() => showLatest()}>
                <FontAwesomeIcon icon={faForward}  size="xl"/>
                &nbsp;
                Show latest {latestFeed.length - 1} notes
            </div>)}
            {mainFeed.map(eventElement)}
            <LoadMore onLoadMore={loadMore} shouldLoadMore={main.end}/>
        </div>
    );
}


function PaymentRelay(address: string, description?: string, lnurlp?: string, npub?: string) {
    return (
        <div className="note card">
            <div className="header flex">
                <div><b>Relay:</b> {address}</div>
            </div> 
            <br/>
            <div className="body">
                <div className="flex">
                    <ZapButton svc={lnurlp} comment={npub} />
                    <div> {description}</div>
                </div>
            </div>
        </div>
    )
}

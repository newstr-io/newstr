import {LexicalComposer} from '@lexical/react/LexicalComposer';

import {ReactNode, useMemo} from 'react';
import {HeadingNode} from '@lexical/rich-text'
import {ListItemNode, ListNode} from '@lexical/list'
import CustomHashtagNode from './Lexical/Hashtag';

import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import { editorState } from './Lexical/Markdown';
import AutoEmbedPlugin, { REGISTER_AUTO_NODES } from './Lexical/AutoEmbed';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { FileExtensionRegex, UrlRegex } from 'Const';

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.
  function onError(error: Error) {
    console.error(error);
  }

  interface EditorProps {
    children?: ReactNode;
    editable?: boolean;
    className?: string
    content: string,
    tags: Tag[],
    users: Map<string, MetadataCache>
  }

  export default function Editor({ editable, content, tags, users }:EditorProps) {

    const initialConfig = {
      namespace: 'SnortEditor',
      onError,
      nodes: [
        ...CustomHashtagNode.nodes(),
        ...REGISTER_AUTO_NODES,
        HeadingNode, ListNode, ListItemNode],
      editable: editable,
      editorState: editorState(content),
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
          <HashtagPlugin />
          <AutoEmbedPlugin 
            tags={tags}
            users={users}
            matchers={LINK_MATCHERS}
          />
          <PlainTextPlugin
            contentEditable={<ContentEditable className="text" />}
            placeholder={<>...</>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalComposer>
      );
  }

  export const LINK_MATCHERS = [
    // Url Match
    (text:string) => {
        const match = UrlRegex.exec(text);
        if (match === null) {
        return null;
        }
        const fullMatch = match[0];
        try {
          const url = new URL(fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`)
          const extension = FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;
          switch(extension) {
            case "gif":
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "webp": {
              return {
                image: true,
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                attributes: { rel: 'noopener', target: '_blank' }, 
              };
            }
            case "mp4":
            case "mov":
            case "mkv":
            case "avi":
            case "m4v": {
                return {
                  video: true,
                  index: match.index,
                  length: fullMatch.length,
                  text: fullMatch,
                  url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                  attributes: { rel: 'noopener', target: '_blank' }, 
                };
            }
            default: {
              return {
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                attributes: { rel: 'noopener', target: '_blank' }, 
              };
            }
          }
        }catch(error) {
          return null
        }
    },
    //Ref Match
    (text:string) => {
      const match = text.match(/#\[(\d+)\]/);
      if(match === null) {
          return null;
      }
      const fullMatch = match[0];
      return {
          index: match.index,
          length: fullMatch.length,
          text: fullMatch,
          tagRefId: parseInt(match[1])
      }
    }
  ];
  
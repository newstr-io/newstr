import { faInfoCircle, faSpinner } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { UserPreferences } from "State/Login"
import { RootState } from "State/Store"
import { useEffect, useState } from "react"
import { render } from "react-dom"
import { useSelector } from "react-redux"

interface Image {
  height?: number
  width?: number
  alt?: "",
  url: string
}

interface LinkMetadata {
  title?: string
  description?: string
  url?: string
  image?: Image, 
  video? :{
      height?: number
      width?: number
      url: string
  }
  keywords?: Array<string>
  articleMeta?: {
      author?: string
      publisher?: string
      section?: string
      published?: string
      modified?: string
      tags?: Array<string>
  }
}

export function RenderedLink({ url }:{url: string}) {

  const renderLinks = useSelector<RootState, boolean>(s => s.login.preferences.renderLinks);
  if(!renderLinks) {
    return <a key={url} href={url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{url}</a>
  }

  const [metadata, setMd] = useState<LinkMetadata>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image,setImage] = useState<Image>()

  const setMetadata = (data:LinkMetadata) => {
      if(data.title) {
          if(data.title.length > 103) {
              setTitle(data.title.slice(0, 100) + '...')
          } else {
              setTitle(data.title)
          }
      }
      if(data.description) {
          if(data.description.length > 900) {
              setDescription(data.description.slice(0,995) + '[...]')
          } else {
              setDescription(data.description)
          }
      }
      if(data.image) {
          setImage(data.image)
      }
      setMd(data)
  }


  useEffect(() => {
      const getMetadata = async (url: string) => {
          if(metadata) return
          try {
              const res = await fetch(`https://nostr-dev.newstr.io/og/${url.toString()}`)
              const data = await res.json() as LinkMetadata;
              setMetadata(data)
          } catch(error) {
              console.log(`could not get metadata for ${url}`)
          }
      }
      getMetadata(url)
  },[url])

  return (metadata && (description || image?.url) ? (
      <div className="link-metadata" onClick={(e) => e.stopPropagation()}>
          <div className="link-title">
              <a key={url} href={url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{title}</a>
          </div>
          <div className="link-description">{description}</div>
          {image && (
              <div className="link-image">
                  <a key={url} href={url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" >
                      <img src={image.url} alt={image.alt} />
                  </a>
              </div>
          )}
          <div className="link-url">
              <span className="info-circle">
                  <FontAwesomeIcon icon={faInfoCircle} />
              </span>
              <a key={url} href={url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext" title={url}>{url.length > 52 ? url.slice(0,49) + '...' : url}</a>
          </div>
      </div>
  ):(
      <>
          <a key={url} href={url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{url}</a>
          {!metadata && <FontAwesomeIcon icon={faSpinner} size="xs" />}
      </>
  ))
}

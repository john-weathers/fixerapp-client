const HoverNav = ({ children, hoverStatus, title }) => {
  return (
    <div>
        <div>{title}</div>
        <div>{hoverStatus && children}</div>
    </div>
  )
}
export default HoverNav
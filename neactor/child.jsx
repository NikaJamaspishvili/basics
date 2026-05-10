export const Child = (props) => {
  return (
    <div {...props}>
      <h1>what is going on guys</h1>
      <p>hello guyyss how are you</p>

      <GrandChild />
    </div>
  );
};

function onClick() {
  alert("clicked");
}

export const GrandChild = () => {
  return (
    <div>
      <input type="text" placeholder="insert your name" />
      <button onClick={onClick}>click</button>
    </div>
  );
};

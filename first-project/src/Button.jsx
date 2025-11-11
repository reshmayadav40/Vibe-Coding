const Button = ({ value, onClick, className }) => {
  return (
    <button className={`button ${className}`} onClick={() => onClick(value)}>
      {value}
    </button>
  );
};

export default Button;

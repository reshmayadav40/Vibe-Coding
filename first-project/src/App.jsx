import { useState } from 'react'
import './App.css'
import Button from './Button.jsx'

function App() {
  const [input, setInput] = useState('0')
  const [prevNumber, setPrevNumber] = useState(null)
  const [operator, setOperator] = useState(null)

  const calculate = (num1, op, num2) => {
    const n1 = parseFloat(num1)
    const n2 = parseFloat(num2)
    switch (op) {
      case '+':
        return (n1 + n2).toString()
      case '-':
        return (n1 - n2).toString()
      case '*':
        return (n1 * n2).toString()
      case '/':
        if (n2 === 0) {
          return 'Error'
        }
        return (n1 / n2).toString()
      default:
        return '0'
    }
  }

  const handleButtonClick = (value) => {
    if (!isNaN(value)) {
      if (input === '0' || input === 'Error') {
        setInput(value)
      } else {
        setInput(input + value)
      }
    } else if (value === '.') {
      if (!input.includes('.')) {
        setInput(input + value)
      }
    } else {
      switch (value) {
        case 'C':
          setInput('0')
          setPrevNumber(null)
          setOperator(null)
          break
        case '+/-':
          if (input !== 'Error') {
            setInput((parseFloat(input) * -1).toString())
          }
          break
        case '%':
          if (input !== 'Error') {
            setInput((parseFloat(input) / 100).toString())
          }
          break
        case '/':
        case '*':
        case '-':
        case '+':
          if (operator && prevNumber && input !== '0') {
            const result = calculate(prevNumber, operator, input)
            setPrevNumber(result)
            setInput('0')
            setOperator(value)
          } else {
            setPrevNumber(input)
            setInput('0')
            setOperator(value)
          }
          break
        case '=':
          if (operator && prevNumber) {
            const result = calculate(prevNumber, operator, input)
            setInput(result)
            setPrevNumber(null)
            setOperator(null)
          }
          break
        default:
          break
      }
    }
  }

  return (
    <div className="calculator">
      <div className="display">
        <span>{input}</span>
      </div>
      <div className="buttons">
        <Button value="C" onClick={handleButtonClick} />
        <Button value="+/-" onClick={handleButtonClick} />
        <Button value="%" onClick={handleButtonClick} />
        <Button value="/" onClick={handleButtonClick} />
        <Button value="7" onClick={handleButtonClick} />
        <Button value="8" onClick={handleButtonClick} />
        <Button value="9" onClick={handleButtonClick} />
        <Button value="*" onClick={handleButtonClick} />
        <Button value="4" onClick={handleButtonClick} />
        <Button value="5" onClick={handleButtonClick} />
        <Button value="6" onClick={handleButtonClick} />
        <Button value="-" onClick={handleButtonClick} />
        <Button value="1" onClick={handleButtonClick} />
        <Button value="2" onClick={handleButtonClick} />
        <Button value="3" onClick={handleButtonClick} />
        <Button value="+" onClick={handleButtonClick} />
        <Button value="0" onClick={handleButtonClick} />
        <Button value="." onClick={handleButtonClick} />
        <Button value="=" onClick={handleButtonClick} />
      </div>
    </div>
  )
}

export default App

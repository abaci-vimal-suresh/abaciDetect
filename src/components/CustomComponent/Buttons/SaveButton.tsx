import React from 'react'
import { Spinner } from 'reactstrap'
import Button from '../../bootstrap/Button'

const SaveButton = ({ state }: any) => {
  return (
    <Button
      color='secondary'
      className='w-100'
      type='submit'
      isDisable={state}
      isOutline
    >
      {state ? <Spinner size='sm' /> : 'Save'}
    </Button>
  )
}

export default SaveButton

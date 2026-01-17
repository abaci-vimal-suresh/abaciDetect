import React, { useRef ,useState } from 'react'
import Card, { CardActions, CardBody, CardHeader } from '../../../bootstrap/Card'
import AddButton from '../../../CustomComponent/Buttons/AddButton'
import DesignationList from './DesignationList'
import AddDesignation from './AddDesignation'

function index() {
    const [addModalShow,setAddModalShow] = useState(false)
    const tableRef = useRef(null)
  return (
    <>
    <AddDesignation isOpen={addModalShow} setIsOpen={setAddModalShow} title='Add Designation'/>
    {/* <Card className='p-2'> */}
    <CardHeader className='fw-bold h5'>
        Designations
        <CardActions>
            <AddButton modalShow={setAddModalShow} name='Add Designation'/>
        </CardActions>
    </CardHeader>
    <CardBody>
        <DesignationList tableRef={tableRef} />
    </CardBody>
    {/* </Card> */}
    </>
  )
}

export default index
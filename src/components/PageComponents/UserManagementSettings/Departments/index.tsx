import React, { useRef ,useState } from 'react'
import Card, { CardActions, CardBody, CardHeader } from '../../../bootstrap/Card'
import AddButton from '../../../CustomComponent/Buttons/AddButton'
import AddDepartment from './AddDesignation'
import DepartmentList from './DepartmentList'

function index() {
    const [addModalShow,setAddModalShow] = useState(false)
    const tableRef = useRef(null)
  return (
    <>
    <AddDepartment isOpen={addModalShow} setIsOpen={setAddModalShow} title='Add Department'/>
    {/* <Card className='p-2'> */}
    <CardHeader className='fw-bold h5'>
        Designations
        <CardActions>
            <AddButton modalShow={setAddModalShow} name='Add Department'/>
        </CardActions>
    </CardHeader>
    <CardBody>
        <DepartmentList tableRef={tableRef} />
    </CardBody>
    {/* </Card> */}
    </>
  )
}

export default index
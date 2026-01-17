import React, { useRef, useState } from 'react'
import Card, { CardActions, CardBody, CardHeader } from '../../bootstrap/Card'
import AddButton from '../../CustomComponent/Buttons/AddButton'
import RegionTable from './RegionTable'
import AddRegionGroups from './AddRegionGroups'

function RegionGroups() {
    const [addModalShow,setAddModalShow] = useState(false)
    const tableRef = useRef(null)
  return (
    <>
    <AddRegionGroups
    isOpen={addModalShow}
    setIsOpen={setAddModalShow}
    title='Add Region Groups'
    />
    <Card className='p-2'>
        <CardHeader className='fw-bold h5'>
            Region Groups
            <CardActions>
                <AddButton modalShow={setAddModalShow} name='Add Region Group'/>
            </CardActions>
        </CardHeader>
        <CardBody>
            <RegionTable tableRef={tableRef} />
        </CardBody>
    </Card>
    </>
  )
}

export default RegionGroups
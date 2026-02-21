import httpx
import asyncio

async def test_update():
    async with httpx.AsyncClient() as client:
        # 1. Get a bin
        drawers = await client.get("http://localhost:8001/api/drawers")
        drawers_data = drawers.json()
        if not drawers_data:
            print("No drawers found")
            return
            
        drawer_id = drawers_data[0]['drawer_id']
        layers = drawers_data[0]['layers']
        if not layers:
            print("No layers found")
            return
            
        bins = layers[0]['bins']
        if not bins:
            print("No bins found")
            return
            
        bin_id = bins[0]['bin_id']
        print(f"Testing with bin {bin_id}")
        
        # 2. Update bin content
        new_title = "UPDATED TITLE " + str(asyncio.get_event_loop().time())
        print(f"Updating title to: {new_title}")
        
        response = await client.patch(
            f"http://localhost:8001/api/bins/{bin_id}",
            json={
                "content": {
                    "title": new_title,
                    "description": "Test description"
                }
            }
        )
        print(f"Update response: {response.status_code}")
        print(f"Response body: {response.json()}")
        
        # 3. Verify update persisted
        verify = await client.get(f"http://localhost:8001/api/bins/{bin_id}")
        verify_data = verify.json()
        print(f"Verification title: {verify_data['content']['title']}")
        
        if verify_data['content']['title'] == new_title:
            print("SUCCESS: Update persisted")
        else:
            print("FAILURE: Update did not persist")

if __name__ == "__main__":
    asyncio.run(test_update())

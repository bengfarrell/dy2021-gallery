export const chooseFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'accept="image/*';
    input.addEventListener('change', (event) => {
        const max_width = 1280;
        const item = event.target.files[0];
        const reader = new FileReader();

        reader.readAsDataURL(item);
        reader.name = item.name;//get the image's name
        reader.size = item.size; //get the image's size
        reader.onload = (event) => {
            const img = new Image();//create a image
            img.src = event.target.result;//result is base64-encoded Data URI
            img.name = event.target.name;//set name (optional)
            img.size = event.target.size;//set size (optional)
            img.onload = (el) => {
                const elem = document.createElement('canvas');//create a canvas
                if (el.target.width > max_width) {
                    const scaleFactor = max_width / el.target.width;
                    elem.width = max_width;
                    elem.height = el.target.height * scaleFactor;
                } else {
                    elem.width = el.target.width;
                    elem.height = el.target.height;
                }

                //draw in canvas
                const ctx = elem.getContext('2d');
                ctx.drawImage(el.target, 0, 0, elem.width, elem.height);

                //get the base64-encoded Data URI from the resize image
                const srcEncoded = ctx.canvas.toDataURL(el.target, 'image/jpeg', 0);

                const image = new Image(elem.width, elem.height);
                image.src = srcEncoded;

                const fd = new FormData();
                fd.append("image", image);
                fd.append('first_name', 'Ben');
                fd.append('last_initial', 'F');
                fd.append('age', '42');
                const xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function(){
                    if (xhr.readyState === 4 && xhr.status === 200){
                        const response = JSON.parse(xhr.responseText);
                        if (response.success === true){
                            alert('The image was uploaded');
                        }
                    }
                }
                xhr.open("POST", 'http://artparty.ctlprojects.com/submit/layer');
                xhr.send(fd);
            }
        }
    });
    input.click();
}

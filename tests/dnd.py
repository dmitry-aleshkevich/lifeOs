def drag(pg, src, dst):
    a=src.bounding_box(); b=dst.bounding_box()
    pg.mouse.move(a["x"]+a["width"]*0.45,a["y"]+a["height"]/2); pg.mouse.down()
    for i in range(1,13): pg.mouse.move(a["x"]+a["width"]*0.45+(b["x"]+40-a["x"]-20)*i/12, a["y"]+a["height"]/2+(b["y"]+min(b["height"]/2,300)-a["y"]-12)*i/12); pg.wait_for_timeout(20)
    pg.wait_for_timeout(80); pg.mouse.up(); pg.wait_for_timeout(150)
